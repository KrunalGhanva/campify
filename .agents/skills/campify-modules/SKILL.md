---
name: campify-modules
description: >-
  Use this skill when modifying, debugging, or adding features to the Campify project. It provides specific conventions, file paths, and architectural boundaries for each module in both the server and client.
---

# Campify Modules

The Campify project consists of several distinct modules across the server (Express + MongoDB) and client (React). 
Before working on any module, you MUST review its architectural boundaries, dependencies, and conventions.

## Instructions

To get the conventions and constraints for the module you are working on, read the `MODULE_PROMPTS.md` file located at the root of the project (`d:\Campify_Project_REACT\MODULE_PROMPTS.md`). 

Look for the relevant section based on the task:

**Server modules:**
- S1. Server Bootstrap & Security Config
- S2. Authentication & Users
- S3. Campgrounds — CRUD, Geocoding & Ownership
- S4. Reviews
- S5. Image Upload (Cloudinary + Multer)
- S6. Shared Utilities & Error Handling
- S7. Seed Data & Legacy Static Assets

**Client modules:**
- C1. App Shell, Routing & Layout
- C2. Auth & Flash Global State (Context Layer)
- C3. API Client Layer
- C4. Campground Browsing — List & Map
- C5. Campground Detail, Reviews & Ratings
- C6. Campground Create/Edit Forms
- C7. Auth Pages (Login / Register)
- C8. Styling & Theming

Once you identify the module, read its specific section in `MODULE_PROMPTS.md` and strictly abide by the "Conventions & gotchas". If delegating to a subagent, use the "Agent prompt" provided in that section.
