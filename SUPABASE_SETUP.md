# Supabase Setup Guide

## Timetable Storage Configuration

To enable timetable uploads and downloads, you must configure a storage bucket in your Supabase dashboard.

### 1. Create Bucket
- Name: `timetables`
- Public: `Enabled` (Allows students to view/download PDFs)

### 2. Set RLS Policies for 'timetables' bucket

#### Policy: Public Read Access
- **Definition**: `(bucket_id = 'timetables'::text)`
- **Allowed Operations**: `SELECT`
- **Target Roles**: `public`

#### Policy: Admin Upload Access
- **Definition**: `(bucket_id = 'timetables'::text)`
- **Allowed Operations**: `INSERT`, `UPDATE`, `DELETE`
- **Target Roles**: `authenticated` (Ensure your Admin users have the appropriate metadata or role check if needed, or simply `authenticated` if only admins use the portal)

## Database Migrations
Ensure all migrations in `supabase/migrations/` have been applied to your project.
