interface EducationItem {
  school: string;
  degree: string;
  year: string;
  description?: string;
}

interface ExperienceItem {
  company: string;
  position: string;
  period: string;
  description: string;
}

interface SkillsItem {
  category: string;
  items: string[];
}

interface ResumeData {
  name: string;
  title: string;
  location: string;
  contacts: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: SkillsItem[];
}

export const formatResumeData = (data: ResumeData) => {
  const formatEducation = (education: EducationItem[]) => {
    return education.map(edu => `
      <div style="margin-bottom: 12px">
        <div style="color: #E2E8F0; font-size: 11px; font-family: Plus Jakarta Sans; font-weight: 600">${edu.school}</div>
        <div style="color: #CBD5E1; font-size: 9px; font-family: Plus Jakarta Sans">${edu.degree} • ${edu.year}</div>
        ${edu.description ? `<div style="color: #94A3B8; font-size: 8px; font-family: Plus Jakarta Sans; margin-top: 4px">${edu.description}</div>` : ''}
      </div>
    `).join('');
  };

  const formatExperience = (experience: ExperienceItem[]) => {
    return experience.map(exp => `
      <div style="margin-bottom: 16px">
        <div style="color: #E2E8F0; font-size: 11px; font-family: Plus Jakarta Sans; font-weight: 600">${exp.company}</div>
        <div style="color: #CBD5E1; font-size: 9px; font-family: Plus Jakarta Sans">${exp.position} • ${exp.period}</div>
        <div style="color: #94A3B8; font-size: 8px; font-family: Plus Jakarta Sans; margin-top: 4px">${exp.description}</div>
      </div>
    `).join('');
  };

  const formatSkills = (skills: SkillsItem[]) => {
    return skills.map(skill => `
      <div style="margin-bottom: 12px">
        <div style="color: #E2E8F0; font-size: 9px; font-family: Plus Jakarta Sans; font-weight: 600; margin-bottom: 4px">${skill.category}</div>
        <div style="color: #94A3B8; font-size: 8px; font-family: Plus Jakarta Sans">${skill.items.join(' • ')}</div>
      </div>
    `).join('');
  };

  const formatContacts = (contacts: string[]) => {
    return contacts.map(contact => `
      <div style="color: #E2E8F0; font-size: 7px; font-family: Plus Jakarta Sans; font-weight: 400; line-height: 11px">${contact}</div>
    `).join('');
  };

  return {
    name: data.name,
    title: data.title,
    location: data.location,
    contacts: formatContacts(data.contacts),
    education: formatEducation(data.education),
    experience: formatExperience(data.experience),
    skills: formatSkills(data.skills)
  };
}; 