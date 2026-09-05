````markdown
# KVS Copilot

KVS Copilot is an automation and data management system designed to simplify the process of entering school statistics into the Kendriya Vidyalaya Sangathan (KVS) statistics portal.

The project connects an **Admin Dashboard**, a **FastAPI backend**, and a **Chrome Extension** to create a controlled workflow from an uploaded Excel file to the corresponding KVS statistics form.

The current MVP focuses on automating:

> **Enrollment Statistics → Class and Social Category Wise Enrollment Status**

Instead of teachers manually transferring data from Excel sheets into multiple KVS form fields, KVS Copilot processes the data, allows it to be reviewed, and then autofills the correct values into the corresponding KVS form.

---

# Problem Statement

Teachers and school staff currently have to manually transfer statistical data from school records and Excel sheets into the KVS statistics portal.

This process involves:

- Reading data from Excel sheets.
- Identifying the correct class.
- Finding the corresponding fields on the KVS portal.
- Entering values manually.
- Checking social category-wise data.
- Verifying that values are entered into the correct fields.
- Repeating the process for multiple classes.

This manual workflow can take approximately **3–4 hours**, depending on the amount of data and the number of entries.

Manual data entry also increases the possibility of:

- Entering data for the wrong class.
- Filling the wrong field.
- Typing errors.
- Missing values.
- Inconsistent category totals.
- Repetitive verification work.

KVS Copilot aims to reduce this repetitive workflow to **less than one hour** by automating the transfer of approved data into the KVS statistics portal.

---

# Solution

KVS Copilot creates a controlled pipeline:

```text
Excel Data
    ↓
Admin Dashboard
    ↓
Data Processing and Analysis
    ↓
Review and Approval
    ↓
FastAPI Backend
    ↓
Approved Data API
    ↓
Chrome Extension
    ↓
Detect Current KVS Class Page
    ↓
Match Correct Record
    ↓
Preview Data
    ↓
Auto-Fill KVS Form
````

The system does not simply fill the first available record.

The Chrome Extension identifies the current KVS statistics page, determines which class is being edited, fetches the approved data, and matches the correct record before autofilling the form.

---

# Current MVP Scope

The KVS Statistics portal contains multiple sections.

The relevant sections include:

1. **Enrollment Statistics**

   * Class and Social Category Wise Enrollment Status

2. **Admission Category Wise Enrollment Status**

3. **Transfer Certificate Issued**

4. **Student Vacancy**

The current MVP specifically implements the complete end-to-end workflow for:

> ## Enrollment Statistics → Class and Social Category Wise Enrollment Status

The other sections are included in the broader backend/category structure and can be extended in future versions of the project.

The current MVP was intentionally kept focused on one complete workflow rather than partially automating multiple sections.

---

# Key Features

## 1. Excel Data Upload

The Admin Dashboard allows school data to be uploaded through an Excel file.

The uploaded data is processed and converted into structured records that can be used by the application.

```text
Excel File
    ↓
Upload
    ↓
Backend Processing
    ↓
Structured Class-Wise Records
```

---

## 2. Data Dashboard

The project includes a dashboard interface for viewing and working with uploaded data.

The dashboard acts as the main control layer between the raw Excel file and the KVS portal.

The workflow allows the data to be:

* Uploaded.
* Processed.
* Structured.
* Reviewed.
* Analysed.
* Approved before being used by the extension.

Only the relevant approved data is passed forward into the autofill workflow.

---

## 3. Needs Attention and Data Analysis

The dashboard can identify inconsistent or problematic entries.

Flagged records can be displayed under a **Needs Attention** section so that potential issues are visible before data is transferred to the KVS portal.

The analysis layer helps identify possible:

* Missing values.
* Inconsistent totals.
* Suspicious category distributions.
* Data that requires manual review.

This adds a validation layer before autofill rather than blindly transferring Excel values into the website.

---

## 4. Confidence-Based Review

The system can provide confidence-related information for processed entries.

This helps distinguish between records that appear consistent and records that may require additional review.

The purpose is to give the user a clearer view of where potential data issues exist before the information reaches the KVS portal.

---

# Chrome Extension

The Chrome Extension is responsible for transferring approved data into the KVS statistics form.

The extension workflow is:

```text
Open KVS Statistics Page
        ↓
Extension Detects Current Page
        ↓
Identify Current Class
        ↓
Fetch Approved Data
        ↓
Find Matching Class Record
        ↓
Show Preview
        ↓
User Clicks Start Auto-Fill
        ↓
Fields Are Filled
```

The extension is designed to work with the supported KVS statistics workflow rather than functioning as a general-purpose autofill extension.

---

# Class Detection and Record Matching

One of the core features of KVS Copilot is matching the current KVS page with the correct class record.

For example:

```text
Current KVS Page
        ↓
Class Identifier Detected
        ↓
Matching Record Found in Backend Data
        ↓
Only That Record Is Used
```

This prevents unrelated class data from being autofilled into the wrong page.

The extension does not blindly insert the first record returned by the API.

Instead, it:

1. Detects the current KVS statistics page.
2. Identifies the class being edited.
3. Fetches approved records.
4. Searches for the matching class record.
5. Displays the matched data.
6. Autofills the corresponding fields after user action.

---

# Data Preview

Before autofill, the extension provides a preview of the matched data.

This gives the user an opportunity to verify that the correct class and values have been detected.

The intended workflow is:

```text
Detect Page
    ↓
Match Record
    ↓
Preview Values
    ↓
Start Auto-Fill
```

This creates an additional layer of control before modifying the KVS form.

---

# Auto-Fill Functionality

After the user clicks **Start Auto-Fill**, the extension maps the backend data to the corresponding KVS form fields.

Example field mappings include:

| Backend Data            | KVS Form Field          |
| ----------------------- | ----------------------- |
| `numberOfSections`      | Number of Sections      |
| `authorisedCapacity`    | Authorised Capacity     |
| `totalEnrolledStudents` | Total Students Enrolled |
| `boys`                  | Boys                    |
| `girls`                 | Girls                   |
| `scheduledCaste`        | SC                      |
| `scheduledTribes`       | ST                      |
| `otherBackwardClasses`  | OBC                     |
| `ph`                    | PH                      |
| `general`               | GEN                     |
| `generalMinorities`     | General Minority        |

The extension also triggers the necessary browser events such as:

```text
input
change
blur
```

This helps ensure that the KVS website recognizes the values as properly entered.

---

# Supported Class-Wise Data

The current workflow handles class-wise records including:

* Balvatika-III
* Class I
* Class II
* Class III
* Class IV
* Class V
* Class VI
* Class VII
* Class VIII
* Class IX
* Class X
* Class XI - Arts
* Class XI - Commerce
* Class XI - Science
* Class XII - Arts
* Class XII - Commerce
* Class XII - Science

The exact data is generated dynamically from the uploaded Excel sheet and structured according to the requirements of the KVS statistics form.

---

# Why Parts of the Backend Are Hardcoded

Some parts of the backend and field mappings are intentionally hardcoded.

This is based on the fact that the KVS statistics portal follows a standardized structure across Kendriya Vidyalayas in India.

The overall sections, categories, and form columns remain consistent across the KVS portal.

For example, the application already knows the structure of:

```text
KVS Statistics
│
├── Enrollment Statistics
│   └── Class and Social Category Wise Enrollment Status
│
├── Admission Category Wise Enrollment Status
│
├── Transfer Certificate Issued
│
└── Student Vacancy
```

Because the structure of the KVS portal is standardized, the application does not need to rediscover or guess the meaning of every field for every individual school.

---

# What Changes Between Schools

The KVS website structure remains standardized, but the **Excel sheet and the actual school data differ**.

This is the reason behind the architecture of KVS Copilot.

```text
Standardized KVS Website Structure
                +
        School-Specific Excel Data
                ↓
           KVS Copilot
                ↓
   Structured and Matched Data
                ↓
      Correct KVS Statistics Form
```

The backend uses predefined knowledge of the KVS form structure while dynamically processing the data from the uploaded Excel sheet.

This means:

* The **website structure is predefined**.
* The **field mappings are predefined**.
* The **categories are predefined**.
* The **school-specific Excel data is dynamic**.

This approach is more reliable for the current MVP than attempting to dynamically guess form structures.

---

# Backend Architecture

The backend is built using **FastAPI**.

Its primary responsibilities include:

* Receiving uploaded Excel files.
* Processing school data.
* Generating structured class-wise records.
* Managing the active data session.
* Providing approved records through APIs.
* Supplying the Chrome Extension with the correct data.

The backend acts as the bridge between the Admin Dashboard and the Chrome Extension.

```text
Admin Dashboard
       ↓
FastAPI Backend
       ↓
Process and Structure Data
       ↓
Approved Data
       ↓
API
       ↓
Chrome Extension
```

---

# API Workflow

The backend exposes endpoints used by the application workflow.

Example flow:

```text
POST /upload
```

Used to upload and process the Excel data.

```text
GET /api/approved/default
```

Used by the Chrome Extension to retrieve approved records from the active session.

The extension then performs class-level matching on the returned data before autofill.

---

# Frontend

The frontend provides the Admin Dashboard interface.

Its purpose is to act as the management and review layer for the uploaded data.

The frontend workflow includes:

```text
Upload Excel
    ↓
Process Data
    ↓
View Structured Records
    ↓
Analyse Data
    ↓
Identify Needs Attention Entries
    ↓
Review
    ↓
Approve
```

The frontend development server runs locally on:

```text
http://localhost:5174
```

---

# Technology Stack

## Frontend

* React
* Vite
* JavaScript / TypeScript components
* Dashboard-based interface

## Backend

* Python
* FastAPI
* Uvicorn

## Chrome Extension

* JavaScript
* Chrome Extension APIs
* Content Scripts
* Background Scripts
* Popup Interface

## Data Processing

* Excel file upload
* Class-wise data processing
* Structured record generation
* API-based communication

---

# Project Architecture

```text
                         ┌─────────────────────┐
                         │     Excel File      │
                         │ School-Specific Data│
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Admin Dashboard   │
                         │                     │
                         │ Upload / Review /   │
                         │ Analyse / Approve   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   FastAPI Backend   │
                         │                     │
                         │ Process Excel Data  │
                         │ Generate Records    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Approved Data API │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Chrome Extension   │
                         │                     │
                         │ Detect Current Page │
                         │ Match Class Record  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Data Preview     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     Auto-Fill       │
                         │  KVS Statistics     │
                         │       Portal        │
                         └─────────────────────┘
```

---

# Project Structure

The project consists of three main parts:

```text
KVS-COPILOT/
│
├── frontend/
│   ├── React application
│   ├── Dashboard components
│   ├── Upload interface
│   ├── Data analysis
│   └── Review workflow
│
├── backend/
│   ├── FastAPI application
│   ├── API routes
│   ├── Excel processing
│   ├── Class-wise data generation
│   └── Session/data handling
│
├── extension/
│   ├── manifest.json
│   ├── Content scripts
│   ├── Background scripts
│   ├── Popup interface
│   ├── API communication
│   └── Auto-fill logic
│
└── README.md
```

---

# Running the Project Locally

## 1. Start the Backend

Install the required Python dependencies.

Then start the FastAPI server:

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

The backend will run at:

```text
http://127.0.0.1:8000
```

---

## 2. Start the Frontend

Navigate to the frontend directory and install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend runs locally at:

```text
http://localhost:5174
```

---

## 3. Load the Chrome Extension

1. Open Google Chrome.
2. Navigate to:

```text
chrome://extensions
```

3. Enable **Developer Mode**.
4. Click **Load unpacked**.
5. Select the project's extension folder.
6. Open the supported KVS statistics page.
7. The extension detects the current page.
8. Open the extension popup.
9. Verify the previewed data.
10. Click **Start Auto-Fill**.

---

# Complete End-to-End Workflow

The complete working flow of KVS Copilot is:

```text
1. Teacher uploads an Excel file
            ↓
2. Dashboard processes the data
            ↓
3. Backend structures class-wise records
            ↓
4. Data is analysed for potential issues
            ↓
5. Problematic entries can be identified
            ↓
6. Relevant data is reviewed and approved
            ↓
7. Approved data becomes available through the API
            ↓
8. Teacher opens the corresponding KVS statistics page
            ↓
9. Chrome Extension detects the current class/page
            ↓
10. Extension fetches approved data
            ↓
11. Matching class record is identified
            ↓
12. Data is displayed for preview
            ↓
13. Teacher clicks Start Auto-Fill
            ↓
14. KVS form fields are automatically populated
```

---

# Time Efficiency

The traditional manual workflow can require approximately **3–4 hours** of repetitive data entry and verification.

KVS Copilot aims to reduce this workflow to:

> **Less than one hour**

The time savings come from reducing:

* Manual field-by-field data entry.
* Repeated switching between Excel and the browser.
* Searching for the correct class record.
* Copying values individually.
* Repeated verification of form fields.

The teacher remains in control of the process through the review and preview stages before autofill.

---

# Current Project Status

The complete MVP workflow is currently operational.

### Working Features

* [x] Excel data upload
* [x] Backend data processing
* [x] Class-wise record generation
* [x] Dashboard workflow
* [x] Data analysis
* [x] Needs Attention / flagged entry handling
* [x] Approved data flow
* [x] FastAPI integration
* [x] Chrome Extension integration
* [x] Current KVS page detection
* [x] Class identification
* [x] Record matching
* [x] Data preview
* [x] Field mapping
* [x] Auto-fill functionality

---

# Design Principle

The central design principle of KVS Copilot is **controlled automation**.

The system is designed so that the process is not:

```text
Excel → Automatically Fill Everything
```

Instead, it follows:

```text
Excel
  ↓
Process
  ↓
Analyse
  ↓
Review
  ↓
Approve
  ↓
Match Correct KVS Page
  ↓
Preview
  ↓
User-Initiated Auto-Fill
```

This reduces the risk of blindly transferring incorrect data while still significantly reducing repetitive manual work.

---

# Future Scope

The current MVP focuses on one complete KVS statistics workflow.

The same architecture can be extended to support:

* Admission Category Wise Enrollment Status
* Transfer Certificate Issued
* Student Vacancy
* Additional KVS statistics modules
* Persistent database storage
* Authentication and role-based access
* Multi-school data management
* Audit logs
* Exportable reports
* More advanced anomaly detection
* Improved validation and confidence analysis

The architecture is designed so that future KVS sections can reuse the same general pattern:

```text
Excel Data
    ↓
Process
    ↓
Validate
    ↓
Approve
    ↓
Map to KVS Section
    ↓
Preview
    ↓
Auto-Fill
```

---

# MVP Summary

KVS Copilot currently solves the workflow for:

> **KVS Enrollment Statistics → Class and Social Category Wise Enrollment Status**

It connects:

```text
Excel Upload
      +
Admin Dashboard
      +
FastAPI Backend
      +
Approved Data API
      +
Chrome Extension
      +
KVS Statistics Portal
```

to reduce a repetitive **3–4 hour manual data-entry workflow to less than one hour**, while maintaining teacher control through data analysis, review, record matching, and preview before autofill.

---

## License

This project is developed as an MVP for simplifying and automating the transfer of school statistics into the KVS statistics portal.

```
```
