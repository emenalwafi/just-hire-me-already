  Just Hire Me Already - README /\* Add a little extra style for the code blocks \*/ pre { white-space: pre-wrap; /\* Wrap long lines in code blocks \*/ word-break: break-all; } body { font-family: 'Inter', sans-serif; /\* Use Inter font \*/ }   

Just Hire Me Already (Job Application Tracker)
==============================================

Project Overview
----------------

This project appears to be a web application designed for managing job postings and tracking candidate applications. It includes features for:

*   **User Authentication:** Registration and login flows (potentially email link and password-based).
*   **Admin Dashboard:** Viewing and managing job listings (creating, updating status).
*   **Candidate Management:** Viewing candidates who applied for specific jobs in a data table.
*   **Dynamic Forms:** Configuration-driven forms for job posting creation and potentially job applications.
*   **Component Playground:** A dedicated section (`/playground`) for testing and showcasing UI input components.

The application uses client-side storage (IndexedDB) for data persistence.

Tech Stack Used
---------------

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **State Management:** Redux Toolkit
*   **Data Storage:** IndexedDB (using `idb` library)
*   **Tables:** TanStack Table (React Table v8)
*   **Forms:** Custom components likely using React state/hooks
*   **Testing:**
    *   Unit/Integration: Jest, React Testing Library
    *   End-to-End: Playwright
*   **Linting/Formatting:** ESLint
*   **Icons:** IconScout Unicons
*   **Utilities:** date-fns, libphonenumber-js, uuid

How to Run Locally
------------------

1.  **Clone the repository:**
    
        git clone https://github.com/emenalwafi/just-hire-me-already
        cd just-hire-me-already
    
2.  **Install dependencies:**
    
    Choose one of the following commands based on your package manager:
    
        npm install
        # or
        yarn install
        # or
        pnpm install
        # or
        bun install
    
3.  **Run the development server:**
    
    Choose one of the following commands:
    
        npm run dev
        # or
        yarn dev
        # or
        pnpm dev
        # or
        bun dev
    
4.  **Open the application:**
    
    Open [http://localhost:3000](http://localhost:3000) (or the port specified in your console) with your browser to see the result.
    

(Note: Initial data seeding for IndexedDB happens automatically when the app starts, handled by `StoreProvider.tsx` and `dbServices.ts`.)