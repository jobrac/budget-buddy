# BudgetBuddy

BudgetBuddy is a modern, feature-rich budgeting application designed to help you take control of your finances. Built with Next.js, Firebase, and Google's Generative AI, it offers powerful tools for personal and collaborative financial management.

## Features

- **Project-Based Budgeting**: Create separate budgets for different life events like a home renovation, office expenses, or a family vacation.
- **Transaction Tracking**: Easily log income and expenses, and organize them with customizable categories.
- **Multi-Account & Currency Support**: Manage multiple financial accounts (e.g., cash, bank accounts, credit cards) in various currencies. Fund transfers and reports are automatically handled with AI-powered currency conversion.
- **Recurring Transactions**: Automate your regular income and expenses (like subscriptions or salaries) to save time and ensure accuracy.
- **Collaborative Budgets**: Share projects with family, partners, or team members. Role-based permissions (Owner, Editor, Viewer) ensure everyone has the right level of access.
- **AI-Powered Assistance**:
  - Get smart suggestions for setting realistic budget goals based on project type.
  - Receive AI-driven recommendations for collaborator roles to optimize teamwork.
- **Insightful Reporting**:
  - **Project Reports**: Visualize your spending with detailed charts and summaries for each project.
  - **Global Reports**: Get a high-level overview of your financial health across all projects, consolidated into your preferred currency.
- **Secure & Scalable**: Your data is protected by Firebase Security Rules, ensuring you and your collaborators only have access to the appropriate information.

## Tech Stack

- **Framework**: Next.js (App Router) & React
- **Backend & Database**: Firebase (App Hosting, Authentication, Firestore)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Generative AI**: Google AI with Genkit
- **Language**: TypeScript

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- A [Firebase Project](https://console.firebase.google.com/)

### Setup Instructions

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/budgetbuddy.git
    cd budgetbuddy
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**
    - Create a `.env` file in the root of the project by copying the example file:
      ```bash
      cp .env.example .env
      ```
    - **Configure Firebase Variables**:
        - Go to your Firebase project's settings.
        - Under the "General" tab, find "Your apps" and select the option to add a web app (or view the config of an existing one).
        - Copy the values from the `firebaseConfig` object into your new `.env` file. For example: `NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...`.
    - **Configure Google AI Key**:
        - Obtain a **Google AI API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey).
        - Open your `.env` file and add your API key to `GEMINI_API_KEY`.

### Running the Application

Once the setup is complete, you can run the application in development mode.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This application is configured for easy deployment to **Firebase App Hosting**.

1.  **Install Firebase CLI**
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase**
    ```bash
    firebase login
    ```
    
3. **Set secrets in Firebase App Hosting**
    Before deploying, you need to set your environment variables as secrets in App Hosting. Run the following command for each variable in your `.env` file:
    ```bash
    firebase apphosting:secrets:set GEMINI_API_KEY
    firebase apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY
    # ... and so on for all other NEXT_PUBLIC_... variables
    ```
    You will be prompted to enter the secret value for each.

4.  **Deploy the Backend**
    ```bash
    firebase apphosting:backends:deploy
    ```
The CLI will build the application and deploy it, providing you with a live URL upon completion.
