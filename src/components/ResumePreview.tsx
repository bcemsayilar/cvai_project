import React from 'react';
import ResumeTemplate from './ResumeTemplate';
import { formatResumeData } from '../utils/resumeFormatter';

interface ResumePreviewProps {
  resumeData: any; // Replace with your actual resume data type
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData }) => {
  const formattedData = formatResumeData(resumeData);

  return (
    <div className="resume-preview">
      <ResumeTemplate data={formattedData} />
    </div>
  );
};

export default ResumePreview; 