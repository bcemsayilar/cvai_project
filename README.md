# Resume Enhancer

This project is a SaaS application designed to enhance resumes using AI. Users can upload their existing resumes, and the application will process them to generate improved versions with enhanced content and design.

## Features

- User authentication and profile management
- Resume upload and storage (Supabase Storage)
- AI-powered resume text extraction (Google Cloud Document AI)
- AI-powered resume enhancement and structured JSON output (Groq API)
- Client-side PDF generation with customizable design (React-PDF/renderer)

## Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Supabase (Database, Authentication, Storage, Edge Functions)
- **AI/ML:** Google Cloud Document AI, Groq API
- **PDF Generation:** @react-pdf/renderer

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd resume-enhancer
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up Supabase:**

    - Create a new Supabase project.
    - Configure authentication (e.g., Email provider).
    - Set up Storage bucket named `resumes`.
    - Deploy the edge function `process-resume` from `supabase/functions/process-resume/index.ts`.
    - Configure environment variables in your Supabase project settings (under Project Settings > Edge Functions > `process-resume`):
        - `GOOGLE_PROJECT_ID`
        - `GOOGLE_PROCESSOR_ID`
        - `GOOGLE_CLIENT_EMAIL`
        - `GOOGLE_PRIVATE_KEY` (Ensure newline characters are correctly escaped if needed, e.g., replace actual newlines with `\n`)
        - `GROQ_API_KEY`

4.  **Set up environment variables:**

    - Copy the `.env.example` file to `.env.local`.
    - Fill in your Supabase project URL and anon key:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    - Note: Google Cloud and Groq API keys are used directly in the Supabase Edge Function and do not need to be in `.env.local`.

5.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure Highlights

- `app/`: Next.js app router pages and API routes.
- `components/`: React components, including UI components and the PDF generator.
- `supabase/`: Supabase configurations and edge functions.
- `public/`: Static assets.

## Contributing

[//]: # (Add contributing guidelines here if applicable)

## License

[//]: # (Add license information here) 