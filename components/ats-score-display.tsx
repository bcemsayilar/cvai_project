"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react"

interface ATSScore {
  keywordMatch: number
  formatScore: number
  contentQuality: number
  readabilityScore: number
  structureScore: number
  overallScore: number
  recommendations: string[]
}

interface ATSScoreDisplayProps {
  originalScore?: ATSScore
  enhancedScore?: ATSScore
  className?: string
}

export function ATSScoreDisplay({ originalScore, enhancedScore, className }: ATSScoreDisplayProps) {
  if (!originalScore && !enhancedScore) {
    return null
  }

  const improvement = enhancedScore && originalScore 
    ? enhancedScore.overallScore - originalScore.overallScore 
    : 0

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          ATS Score Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {originalScore && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Original Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(originalScore.overallScore)}`}>
                {originalScore.overallScore}
              </div>
              <Badge variant={getScoreBadgeVariant(originalScore.overallScore)} className="mt-2">
                {originalScore.overallScore >= 80 ? "Excellent" : 
                 originalScore.overallScore >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
          )}
          
          {enhancedScore && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Enhanced Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(enhancedScore.overallScore)}`}>
                {enhancedScore.overallScore}
              </div>
              <Badge variant={getScoreBadgeVariant(enhancedScore.overallScore)} className="mt-2">
                {enhancedScore.overallScore >= 80 ? "Excellent" : 
                 enhancedScore.overallScore >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
          )}
        </div>

        {/* Improvement Indicator */}
        {originalScore && enhancedScore && (
          <div className="text-center py-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-2 mb-2">
              {improvement > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : improvement < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Target className="h-5 w-5 text-blue-600" />
              )}
              <span className="font-semibold">
                {improvement > 0 ? `+${improvement}` : improvement} point improvement
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {improvement > 0 
                ? "Great job! Your resume is now more ATS-friendly." 
                : improvement < 0 
                ? "The enhancement focused on visual appeal over ATS optimization."
                : "Your ATS score remained the same."}
            </div>
          </div>
        )}

        {/* Detailed Breakdown */}
        {(enhancedScore || originalScore) && (
          <div className="space-y-4">
            <h4 className="font-semibold">Score Breakdown</h4>
            
            {/* Use enhanced score if available, otherwise use original score */}
            {(() => {
              const scoreToShow = enhancedScore || originalScore!
              return (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Keyword Match</span>
                      <span>{scoreToShow.keywordMatch}/100</span>
                    </div>
                    <Progress value={scoreToShow.keywordMatch} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Format Score</span>
                      <span>{scoreToShow.formatScore}/100</span>
                    </div>
                    <Progress value={scoreToShow.formatScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Content Quality</span>
                      <span>{scoreToShow.contentQuality}/100</span>
                    </div>
                    <Progress value={scoreToShow.contentQuality} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Readability</span>
                      <span>{scoreToShow.readabilityScore}/100</span>
                    </div>
                    <Progress value={scoreToShow.readabilityScore} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Structure</span>
                      <span>{scoreToShow.structureScore}/100</span>
                    </div>
                    <Progress value={scoreToShow.structureScore} className="h-2" />
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Recommendations */}
        {(() => {
          const scoreToShow = enhancedScore || originalScore
          return scoreToShow?.recommendations && scoreToShow.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-1 text-sm">
                {scoreToShow.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}
