"use client"

import { useState, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, RefreshCw, AlertCircle } from "lucide-react"
import { ResumeContent } from "./resume-preview"

interface ResumeEditorProps {
  initialData: ResumeContent
  onSave: (data: ResumeContent) => void
  onError: (error: string) => void
}

export function ResumeEditor({ initialData, onSave, onError }: ResumeEditorProps) {
  const [data, setData] = useState<ResumeContent>(initialData)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update local data when initialData changes
  useEffect(() => {
    setData(initialData)
    setHasChanges(false)
  }, [initialData])

  const updateField = useCallback((field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasChanges(true)
  }, [])

  const updateNestedField = useCallback((section: string, index: number, field: string, value: any) => {
    setData(prev => {
      const sectionData = [...(prev[section as keyof ResumeContent] as any[] || [])]
      sectionData[index] = {
        ...sectionData[index],
        [field]: value
      }
      return {
        ...prev,
        [section]: sectionData
      }
    })
    setHasChanges(true)
  }, [])

  const addArrayItem = useCallback((section: string, template: any) => {
    setData(prev => {
      const currentArray = prev[section as keyof ResumeContent] as any[] || []
      return {
        ...prev,
        [section]: [...currentArray, template]
      }
    })
    setHasChanges(true)
  }, [])

  const removeArrayItem = useCallback((section: string, index: number) => {
    setData(prev => {
      const currentArray = prev[section as keyof ResumeContent] as any[] || []
      return {
        ...prev,
        [section]: currentArray.filter((_, i) => i !== index)
      }
    })
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await onSave(data)
      setHasChanges(false)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }, [data, onSave, onError])

  const handleReset = useCallback(() => {
    setData(initialData)
    setHasChanges(false)
  }, [initialData])

  return (
    <Card className="w-full p-6 dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold dark:text-white">Resume Editor</h2>
          <Badge variant="outline" className="text-xs">
            Premium Feature
          </Badge>
          {hasChanges && (
            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
              <AlertCircle size={16} />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleReset} 
            variant="outline" 
            size="sm"
            disabled={!hasChanges || isSaving}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            size="sm"
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <div className="w-full overflow-x-auto">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="basic" className="whitespace-nowrap">Basic Info</TabsTrigger>
            <TabsTrigger value="experience" className="whitespace-nowrap">Experience</TabsTrigger>
            <TabsTrigger value="education" className="whitespace-nowrap">Education</TabsTrigger>
            <TabsTrigger value="skills" className="whitespace-nowrap">Skills</TabsTrigger>
            <TabsTrigger value="projects" className="whitespace-nowrap">Projects</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={data.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="title">Professional Title</Label>
              <Input
                id="title"
                value={data.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Your job title"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={data.summary || ''}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Brief professional summary"
              rows={3}
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label>Contact Information</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                value={data.contact?.email || ''}
                onChange={(e) => updateField('contact', { ...data.contact, email: e.target.value })}
                placeholder="Email address"
              />
              <Input
                value={data.contact?.phone || ''}
                onChange={(e) => updateField('contact', { ...data.contact, phone: e.target.value })}
                placeholder="Phone number"
              />
              <Input
                value={data.contact?.location || ''}
                onChange={(e) => updateField('contact', { ...data.contact, location: e.target.value })}
                placeholder="Location"
              />
              <Input
                value={data.contact?.linkedin || ''}
                onChange={(e) => updateField('contact', { ...data.contact, linkedin: e.target.value })}
                placeholder="LinkedIn URL"
              />
              <Input
                value={data.contact?.github || ''}
                onChange={(e) => updateField('contact', { ...data.contact, github: e.target.value })}
                placeholder="GitHub URL"
              />
              <Input
                value={data.contact?.website || ''}
                onChange={(e) => updateField('contact', { ...data.contact, website: e.target.value })}
                placeholder="Website URL"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Work Experience</h3>
            <Button
              onClick={() => addArrayItem('experience', {
                position: '',
                company: '',
                location: '',
                dates: '',
                highlights: ['']
              })}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Experience
            </Button>
          </div>

          {(data.experience || []).map((exp, index) => (
            <Card key={index} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Experience {index + 1}</h4>
                <Button
                  onClick={() => removeArrayItem('experience', index)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={exp.position || ''}
                  onChange={(e) => updateNestedField('experience', index, 'position', e.target.value)}
                  placeholder="Job Title"
                />
                <Input
                  value={exp.company || ''}
                  onChange={(e) => updateNestedField('experience', index, 'company', e.target.value)}
                  placeholder="Company Name"
                />
                <Input
                  value={exp.location || ''}
                  onChange={(e) => updateNestedField('experience', index, 'location', e.target.value)}
                  placeholder="Location"
                />
                <Input
                  value={exp.dates || ''}
                  onChange={(e) => updateNestedField('experience', index, 'dates', e.target.value)}
                  placeholder="Date Range (e.g., Jan 2020 - Present)"
                />
              </div>

              <div>
                <Label>Key Achievements & Responsibilities</Label>
                {(exp.highlights || []).map((highlight, hIndex) => (
                  <div key={hIndex} className="flex items-center space-x-2 mt-2">
                    <Textarea
                      value={highlight}
                      onChange={(e) => {
                        const newHighlights = [...(exp.highlights || [])]
                        newHighlights[hIndex] = e.target.value
                        updateNestedField('experience', index, 'highlights', newHighlights)
                      }}
                      placeholder="Achievement or responsibility"
                      rows={2}
                    />
                    <Button
                      onClick={() => {
                        const newHighlights = (exp.highlights || []).filter((_, i) => i !== hIndex)
                        updateNestedField('experience', index, 'highlights', newHighlights)
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => {
                    const newHighlights = [...(exp.highlights || []), '']
                    updateNestedField('experience', index, 'highlights', newHighlights)
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Achievement
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Education</h3>
            <Button
              onClick={() => addArrayItem('education', {
                degree: '',
                institution: '',
                location: '',
                dates: '',
                details: []
              })}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Education
            </Button>
          </div>

          {(data.education || []).map((edu, index) => (
            <Card key={index} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Education {index + 1}</h4>
                <Button
                  onClick={() => removeArrayItem('education', index)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={edu.degree || ''}
                  onChange={(e) => updateNestedField('education', index, 'degree', e.target.value)}
                  placeholder="Degree"
                />
                <Input
                  value={edu.institution || ''}
                  onChange={(e) => updateNestedField('education', index, 'institution', e.target.value)}
                  placeholder="Institution"
                />
                <Input
                  value={edu.location || ''}
                  onChange={(e) => updateNestedField('education', index, 'location', e.target.value)}
                  placeholder="Location"
                />
                <Input
                  value={edu.dates || ''}
                  onChange={(e) => updateNestedField('education', index, 'dates', e.target.value)}
                  placeholder="Date Range"
                />
              </div>

              <div>
                <Label>Additional Details (GPA, Honors, etc.)</Label>
                {(edu.details || []).map((detail, dIndex) => (
                  <div key={dIndex} className="flex items-center space-x-2 mt-2">
                    <Input
                      value={detail}
                      onChange={(e) => {
                        const newDetails = [...(edu.details || [])]
                        newDetails[dIndex] = e.target.value
                        updateNestedField('education', index, 'details', newDetails)
                      }}
                      placeholder="GPA, honors, relevant coursework, etc."
                    />
                    <Button
                      onClick={() => {
                        const newDetails = (edu.details || []).filter((_, i) => i !== dIndex)
                        updateNestedField('education', index, 'details', newDetails)
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => {
                    const newDetails = [...(edu.details || []), '']
                    updateNestedField('education', index, 'details', newDetails)
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Detail
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Skills</h3>
          </div>

          <div className="space-y-2">
            <Label>Technical Skills</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {(data.skills || []).map((skill, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{skill}</span>
                  <button
                    onClick={() => {
                      const newSkills = (data.skills || []).filter((_, i) => i !== index)
                      updateField('skills', newSkills)
                    }}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Add a skill"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement
                    if (input.value.trim()) {
                      updateField('skills', [...(data.skills || []), input.value.trim()])
                      input.value = ''
                    }
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                  if (input.value.trim()) {
                    updateField('skills', [...(data.skills || []), input.value.trim()])
                    input.value = ''
                  }
                }}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Tools Section */}
          <div className="space-y-2">
            <Label>Tools & Technologies</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {(data.tools || []).map((tool, index) => (
                <Badge key={index} variant="outline" className="flex items-center space-x-1">
                  <span>{tool}</span>
                  <button
                    onClick={() => {
                      const newTools = (data.tools || []).filter((_, i) => i !== index)
                      updateField('tools', newTools)
                    }}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Add a tool or technology"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement
                    if (input.value.trim()) {
                      updateField('tools', [...(data.tools || []), input.value.trim()])
                      input.value = ''
                    }
                  }
                }}
              />
              <Button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement
                  if (input.value.trim()) {
                    updateField('tools', [...(data.tools || []), input.value.trim()])
                    input.value = ''
                  }
                }}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Projects</h3>
            <Button
              onClick={() => addArrayItem('projects', {
                name: '',
                description: '',
                link: ''
              })}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Project
            </Button>
          </div>

          {(data.projects || []).map((project, index) => (
            <Card key={index} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Project {index + 1}</h4>
                <Button
                  onClick={() => removeArrayItem('projects', index)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={project.name || ''}
                  onChange={(e) => updateNestedField('projects', index, 'name', e.target.value)}
                  placeholder="Project Name"
                />
                <Input
                  value={project.link || ''}
                  onChange={(e) => updateNestedField('projects', index, 'link', e.target.value)}
                  placeholder="Project URL (optional)"
                />
              </div>

              <div>
                <Label>Project Description</Label>
                <Textarea
                  value={project.description || ''}
                  onChange={(e) => updateNestedField('projects', index, 'description', e.target.value)}
                  placeholder="Brief description of the project, technologies used, and your role"
                  rows={3}
                />
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </Card>
  )
}
