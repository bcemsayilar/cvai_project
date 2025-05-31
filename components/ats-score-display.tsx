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
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <Card className={`${className} dark:bg-gray-900 dark:border-gray-700`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 dark:text-gray-100">
          <Target className="h-5 w-5" />
          ATS Score Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Comparison */}
        <div className={`grid gap-4 ${originalScore && enhancedScore ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          {originalScore && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground dark:text-gray-400 mb-2">Original Score</div>
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
              <div className="text-sm text-muted-foreground dark:text-gray-400 mb-2">Enhanced Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(enhancedScore.overallScore)}`}>
                {enhancedScore.overallScore}
              </div>
              <Badge variant={getScoreBadgeVariant(enhancedScore.overallScore)} className="mt-2">
                {enhancedScore.overallScore >= 80 ? "Excellent" : 
                 enhancedScore.overallScore >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
          )}
        </div>        {/* Improvement Indicator */}
        {originalScore && enhancedScore && (
          <div className="text-center py-4 border rounded-lg bg-muted/50 dark:bg-gray-800/50 dark:border-gray-600">
            <div className="flex items-center justify-center gap-2 mb-2">
              {improvement > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : improvement < 0 ? (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
              <span className="font-semibold dark:text-gray-100">
                {improvement > 0 ? `+${improvement}` : improvement} point improvement
              </span>
            </div>
            <div className="text-sm text-muted-foreground dark:text-gray-400">
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
            <h4 className="font-semibold dark:text-gray-100">Score Breakdown</h4>
            
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
              <h4 className="font-semibold flex items-center gap-2 dark:text-gray-100">
                <AlertCircle className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-1 text-sm dark:text-gray-200">
                {scoreToShow.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground dark:text-gray-400">•</span>
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
