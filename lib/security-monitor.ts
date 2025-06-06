// Security monitoring and logging utilities

interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'suspicious_request' | 'file_upload' | 'csrf_violation' | 'input_validation';
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  details?: Record<string, any>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Log security events
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console based on severity
    const logMessage = `Security Event [${event.type}] - ${event.severity.toUpperCase()}`;
    
    switch (event.severity) {
      case 'critical':
        console.error(logMessage, fullEvent);
        break;
      case 'high':
        console.warn(logMessage, fullEvent);
        break;
      case 'medium':
        console.log(logMessage, fullEvent);
        break;
      case 'low':
        console.debug(logMessage, fullEvent);
        break;
    }

    // In production, you might want to send critical events to an external service
    if (event.severity === 'critical' && process.env.NODE_ENV === 'production') {
      this.alertCriticalEvent(fullEvent);
    }
  }

  // Get recent events (for monitoring dashboard)
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events.slice(-limit).reverse();
  }

  // Get events by type
  getEventsByType(type: SecurityEvent['type'], hours: number = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events.filter(event => 
      event.type === type && event.timestamp > cutoff
    );
  }

  // Check for suspicious patterns
  detectSuspiciousActivity(ip: string, hours: number = 1): {
    suspicious: boolean;
    reason?: string;
    eventCount: number;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => 
      event.ip === ip && event.timestamp > cutoff
    );

    // Too many auth failures
    const authFailures = recentEvents.filter(e => e.type === 'auth_failure');
    if (authFailures.length > 5) {
      return {
        suspicious: true,
        reason: 'Too many authentication failures',
        eventCount: authFailures.length
      };
    }

    // Too many rate limit hits
    const rateLimitHits = recentEvents.filter(e => e.type === 'rate_limit');
    if (rateLimitHits.length > 10) {
      return {
        suspicious: true,
        reason: 'Excessive rate limiting',
        eventCount: rateLimitHits.length
      };
    }

    // Too many suspicious requests
    const suspiciousRequests = recentEvents.filter(e => e.type === 'suspicious_request');
    if (suspiciousRequests.length > 3) {
      return {
        suspicious: true,
        reason: 'Multiple suspicious requests',
        eventCount: suspiciousRequests.length
      };
    }

    return {
      suspicious: false,
      eventCount: recentEvents.length
    };
  }

  // Alert for critical events (placeholder for external alerting)
  private alertCriticalEvent(event: SecurityEvent): void {
    // In a real application, you would send this to:
    // - Slack/Discord webhook
    // - Email alerts
    // - Security monitoring service (like Sentry)
    // - Database for persistent storage
    
    console.error('CRITICAL SECURITY EVENT - IMMEDIATE ATTENTION REQUIRED:', {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      endpoint: event.endpoint,
      details: event.details,
      timestamp: event.timestamp.toISOString()
    });
  }

  // Generate security report
  generateSecurityReport(hours: number = 24): {
    summary: Record<string, number>;
    criticalEvents: SecurityEvent[];
    suspiciousIPs: string[];
    totalEvents: number;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentEvents = this.events.filter(event => event.timestamp > cutoff);

    const summary = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const criticalEvents = recentEvents.filter(event => 
      event.severity === 'critical' || event.severity === 'high'
    );

    const ipCounts = recentEvents.reduce((acc, event) => {
      if (event.ip) {
        acc[event.ip] = (acc[event.ip] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const suspiciousIPs = Object.entries(ipCounts)
      .filter(([_, count]) => count > 20) // More than 20 events in time period
      .map(([ip]) => ip);

    return {
      summary,
      criticalEvents,
      suspiciousIPs,
      totalEvents: recentEvents.length
    };
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance();

// Helper functions for common security events
export const logSecurityEvent = {
  authFailure: (details: { userId?: string; ip?: string; userAgent?: string; reason?: string }) => {
    securityMonitor.logEvent({
      type: 'auth_failure',
      severity: 'medium',
      ...details,
      details: { reason: details.reason }
    });
  },

  rateLimitHit: (details: { userId?: string; ip?: string; endpoint?: string; limit?: string }) => {
    securityMonitor.logEvent({
      type: 'rate_limit',
      severity: 'low',
      ...details,
      details: { limit: details.limit }
    });
  },

  suspiciousRequest: (details: { ip?: string; userAgent?: string; endpoint?: string; reason?: string }) => {
    securityMonitor.logEvent({
      type: 'suspicious_request',
      severity: 'high',
      ...details,
      details: { reason: details.reason }
    });
  },

  fileUpload: (details: { userId?: string; fileName?: string; fileSize?: number; fileType?: string }) => {
    securityMonitor.logEvent({
      type: 'file_upload',
      severity: 'low',
      ...details,
      details: {
        fileName: details.fileName,
        fileSize: details.fileSize,
        fileType: details.fileType
      }
    });
  },

  csrfViolation: (details: { ip?: string; endpoint?: string; reason?: string }) => {
    securityMonitor.logEvent({
      type: 'csrf_violation',
      severity: 'high',
      ...details,
      details: { reason: details.reason }
    });
  },

  inputValidationFailure: (details: { endpoint?: string; input?: string; reason?: string }) => {
    securityMonitor.logEvent({
      type: 'input_validation',
      severity: 'medium',
      ...details,
      details: { 
        input: details.input?.substring(0, 100), // Truncate sensitive data
        reason: details.reason 
      }
    });
  }
};

// Request helper to extract common security info
export function extractRequestInfo(request: Request): {
  ip?: string;
  userAgent?: string;
  endpoint?: string;
} {
  return {
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: new URL(request.url).pathname
  };
}
