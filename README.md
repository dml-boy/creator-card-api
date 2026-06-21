# Creator Card Microservice API

A REST API microservice built in Node.js/Express.js and MongoDB that allows creators to publish shareable profile cards (similar to "link-in-bio" profiles) with optional rate cards attached.

---

## 🚀 Features

- **Standard Layered Architecture**: Clean decoupling between route endpoints, service logic, and MongoDB database repository.
- **VSL Integration**: Performs structured request validation utilising the framework's native VSL (Validation Specification Language) engine.
- **Conditional Access Controls**: Fully supports public/private cards requiring a 6-character alphanumeric pin access code.
- **Safe Soft Deletion**: Integrated paranoid document handling that frees up unique slugs upon record deletion.
- **Auto Slug Formatting**: Automates slug generation based on profile title with collision handling and suffix appends.

---

## 🗂️ Project Structure

- **[models/creator-card.js](file:///c:/Users/Admin/Downloads/NodejsBackendEngineer2026-Assessment/models/creator-card.js)**: Schema definition using `ModelSchema` and `paranoid: true`.
- **[repository/creator-card/index.js](file:///c:/Users/Admin/Downloads/NodejsBackendEngineer2026-Assessment/repository/creator-card/index.js)**: Repository instantiation.
- **[services/creator-cards/](file:///c:/Users/Admin/Downloads/NodejsBackendEngineer2026-Assessment/services/creator-cards/)**: Services directory containing creation, retrieval, and deletion logics.
- **[endpoints/creator-cards/](file:///c:/Users/Admin/Downloads/NodejsBackendEngineer2026-Assessment/endpoints/creator-cards/)**: HTTP endpoint routers mapping endpoints.

---

## ⚙️ Getting Started

### 1. Installation
Install dependencies:
```bash
npm install
```

### 2. Configuration
Copy the env template:
```bash
cp .env.example .env
```
Provide the `MONGODB_URI` connection string pointing to your MongoDB instance (local or Atlas cluster).

### 3. Run Server
Start the Express server:
```bash
npm start
```

---

## 🧪 Verification & Testing

We provide a comprehensive verification test suite covering all 16 specified success and failure scenarios in **[scratch/test-creator-cards.js](file:///c:/Users/Admin/Downloads/NodejsBackendEngineer2026-Assessment/scratch/test-creator-cards.js)**.

Run the test suite:
```bash
node scratch/test-creator-cards.js
```

### Output:
```text
--- Cleaning database ---
Database cleaned successfully.

--- Starting Creator Card API Verification ---
[PASS] TC1: Create Card (george-cooks)
[PASS] TC2: Slug Auto-Generation
[PASS] TC3: Create Private Card
[PASS] TC4: Retrieve Public Card
[PASS] TC5: Retrieve Private Card with Correct Pin
[PASS] TC6: Delete Card (ada-designs-things)
[PASS] TC7: Duplicate Slug Error (SL02)
[PASS] TC8: Missing Access Code Error (AC01)
[PASS] TC9: Access Code on Public Card Error (AC05)
[PASS] TC10: Framework Validation Failure
[PASS] TC11: Non-existent Card Error (NF01)
[PASS] TC12: Draft Card Error (NF02)
[PASS] TC13: Retrieve Private Card Without Pin Error (AC03)
[PASS] TC14: Retrieve Private Card With Wrong Pin Error (AC04)
[PASS] TC15: Delete Non-existent Card Error (NF01)
[PASS] TC16: Retrieve Deleted Card Error (NF01)

--- Verification Summary ---
Passed: 16/16
Failed: 0/16
All tests passed successfully!
```

---

## 🗂️ Custom Business Error Codes

| Error Code | HTTP Status | Meaning | Reason/Rule Triggered |
| :--- | :--- | :--- | :--- |
| **SL02** | 400 | Slug already taken | The requested slug is already assigned to another active card. |
| **AC01** | 400 | Missing access code | A private card creation request is missing the required `access_code`. |
| **AC05** | 400 | Invalid access code presence | A public card creation request contains an `access_code`. |
| **NF01** | 404 | Creator card not found | The requested card slug does not exist, or has been deleted. |
| **NF02** | 404 | Draft card retrieval | The requested card slug exists but its status is `draft`. |
| **AC03** | 403 | Access code required | The card is private but no query parameter `access_code` was supplied. |
| **AC04** | 403 | Invalid access code | The private card's supplied query parameter `access_code` does not match. |
