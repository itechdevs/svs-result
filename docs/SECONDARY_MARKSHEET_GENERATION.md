# Secondary Marksheet Generation

## Overview
This document describes the implementation of marksheet/transcript generation for secondary level students (Grades 6-12). The system generates professional PDF documents for both term exams and annual results.

## Features

### Two Types of Marksheets

#### 1. Term Marksheet (Landscape A4)
- **Purpose**: Generated after each term exam is published
- **Layout**: Landscape A4 format for better component visibility
- **Contains**:
  - Student information (Name, Roll Number, Grade, Section)
  - Exam and Academic Year details
  - Subject-wise breakdown:
    - Internal marks
    - Theory marks
    - Practical marks
    - Total marks obtained/full marks
    - Grade Point (GP)
    - Grade letter
  - Credit Hours per subject
  - Summary statistics:
    - Total subjects
    - Passed subjects
    - NG (Not Graded) subjects
    - Total credit hours
    - Term GPA
  - Result status (PROMOTED / NG BLOCKED)
  - Grading system legend
  - Signatures (Class Teacher, Principal)
  - Date of issue

#### 2. Annual Transcript (Portrait A4)
- **Purpose**: Generated at end of academic year
- **Layout**: Portrait A4 format (traditional transcript style)
- **Contains**:
  - Student information with class rank
  - Academic year details
  - Subject-wise annual performance:
    - Credit Hours
    - Weighted marks (from all terms)
    - Percentage
    - Grade Point
    - Grade letter
  - Summary statistics:
    - Total subjects
    - Passed subjects
    - NG subjects
    - Total credit hours
    - Annual GPA (credit-hour weighted)
  - Result status
  - Remarks (optional)
  - Grading system explanation
  - Signatures and date

## Architecture

### Components

#### 1. PDF Generation Components

**`SecondaryTermMarksheetPDF.tsx`**
- React PDF component for term marksheets
- Landscape orientation for component breakdown
- Blue color theme (#1e3a8a)
- Styled table with alternating row colors
- Comprehensive grading legend

**`SecondaryAnnualMarksheetPDF.tsx`**
- React PDF component for annual transcripts
- Portrait orientation (standard transcript)
- Purple color theme (#7c3aed)
- Weighted marks display
- Class rank inclusion

#### 2. Download Component

**`SecondaryMarksheetDownload.tsx`**
- Unified component handling both term and annual downloads
- Uses `@react-pdf/renderer` PDFDownloadLink
- Two variants: `button` (full button) and `icon` (small icon button)
- Helper functions:
  - `prepareTermMarksheetData()`: Transforms API data for term marksheet
  - `prepareAnnualMarksheetData()`: Transforms API data for annual transcript
- Automatic filename generation

#### 3. Viewer Modal

**`SecondaryMarksheetModal.tsx`**
- Modal dialog for viewing marksheet details before download
- Displays:
  - Student information summary
  - Result statistics
  - Marksheet type
  - Download button
- Uses React Query for data fetching
- Loading and error states

### API Endpoints

#### POST `/api/admin/secondary/marksheets`
**Purpose**: Generate/snapshot marksheet metadata

**Request Body**:
```typescript
{
  termResultId?: string;    // For term marksheet
  annualResultId?: string;  // For annual transcript
}
```

**Process**:
1. Validates result exists and is published
2. Fetches result with all subject results
3. Creates or updates `SecondaryMarksheet` record
4. Stores full snapshot in `metadata` JSON field
5. Records generation timestamp and admin user

**Response**:
```typescript
{
  success: true,
  data: {
    id: string;
    syncedStudentId: string;
    termResultId?: string;
    annualResultId?: string;
    academicYearId: string;
    generatedById: string;
    generatedAt: Date;
    metadata: object;  // Full result snapshot
  }
}
```

#### GET `/api/admin/secondary/marksheets/[id]`
**Purpose**: Fetch marksheet with full details for PDF generation

**Response**: Complete marksheet data including:
- Student details
- Term or annual result with all subject results
- Academic year information
- Exam details (for term marksheets)
- Subject configuration with subject names

## Database Schema

```prisma
model SecondaryMarksheet {
  id              String   @id @default(cuid())
  syncedStudentId String
  termResultId    String?  @unique
  annualResultId  String?  @unique
  examId          String?
  academicYearId  String
  generatedById   String
  generatedAt     DateTime @default(now())
  fileUrl         String?  // Future: S3/CDN URL
  metadata        Json     // Full snapshot
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  syncedStudent SyncedStudent          @relation(...)
  termResult    SecondaryTermResult?   @relation(...)
  annualResult  SecondaryAnnualResult? @relation(...)
  academicYear  AcademicYear           @relation(...)
  generatedBy   User                   @relation(...)
}
```

## Usage

### 1. From Result Compilation Page

**Term Results**:
```typescript
// After publishing term results
const handleGenerateMarksheet = (studentId: string, resultId: string) => {
  generateMarksheetMutation.mutate({
    termResultId: resultId
  });
};
```

**Annual Results**:
```typescript
// After publishing annual results
const handleGenerateMarksheet = (studentId: string, resultId: string) => {
  generateMarksheetMutation.mutate({
    annualResultId: resultId
  });
};
```

### 2. Direct PDF Download

```tsx
import { SecondaryMarksheetDownload, prepareTermMarksheetData } from '@/components/secondary/SecondaryMarksheetDownload';

// Prepare data from API response
const marksheetData = prepareTermMarksheetData(termResult, subjectResults);

// Render download button
<SecondaryMarksheetDownload 
  data={marksheetData} 
  variant="button" 
/>
```

### 3. With Modal Viewer

```tsx
import { SecondaryMarksheetModal } from '@/components/secondary/SecondaryMarksheetModal';

const [marksheetId, setMarksheetId] = useState<string | null>(null);
const [modalOpen, setModalOpen] = useState(false);

// Open modal
const handleViewMarksheet = (id: string) => {
  setMarksheetId(id);
  setModalOpen(true);
};

// Render modal
<SecondaryMarksheetModal
  marksheetId={marksheetId}
  open={modalOpen}
  onClose={() => setModalOpen(false)}
/>
```

## Grading System

The marksheets display the following grading scale:

| Grade | Percentage | Grade Point |
|-------|-----------|-------------|
| A+    | 90-100    | 4.0         |
| A     | 80-89     | 3.6         |
| B+    | 70-79     | 3.2         |
| B     | 60-69     | 2.8         |
| C+    | 50-59     | 2.4         |
| C     | 40-49     | 2.0         |
| D+    | 30-39     | 1.6         |
| D     | 20-29     | 1.2         |
| NG    | 0-19      | Not Graded  |

**NG (Not Graded)**: Below 35% - student must retake

## GPA Calculation

### Term GPA
```
GPA = Σ(Grade Point × Credit Hours) / Σ(Credit Hours)
```

### Annual GPA
```
Annual GPA = Σ(Term GPA × Term Weight) / 100
```
where Term Weight is configured per exam (e.g., First Term: 40%, Second Term: 60%)

## Workflow

### Term Marksheet Generation
1. **Teachers**: Enter marks for each component (Internal, Theory, Practical)
2. **Teachers**: Submit marks for verification
3. **Admin**: Verify all marks in Mark Verification Dashboard
4. **Admin**: Compile term results (calculates GPA, determines promotion status)
5. **Admin**: Publish term results
6. **Admin**: Generate marksheet snapshot (creates metadata record)
7. **Admin/Student**: Download PDF marksheet

### Annual Transcript Generation
1. **Admin**: Ensure all term results are compiled and published
2. **Admin**: Compile annual results (applies term weights)
3. **Admin**: Publish annual results
4. **Admin**: Generate annual transcript
5. **Admin/Student**: Download PDF transcript

## Styling Features

### Design Elements
- **Professional Layout**: School branding at top
- **Color Coding**:
  - Term: Blue theme (academic, calm)
  - Annual: Purple theme (prestigious, formal)
  - Grades: Green for pass, Red for NG
- **Typography**: Helvetica font family (professional, readable)
- **Borders and Spacing**: Clean separation of sections
- **Alternating Rows**: Better readability in tables
- **Summary Sections**: Highlighted boxes for key metrics

### Accessibility
- High contrast text and backgrounds
- Clear section separations
- Readable font sizes (8-16pt)
- Professional color palette

## Future Enhancements

### Planned Features
1. **S3/CDN Storage**: Store generated PDFs for faster access
2. **Email Delivery**: Auto-send marksheets to student emails
3. **QR Code**: Add verification QR code on marksheet
4. **Multilingual**: Support Nepali language marksheets
5. **Digital Signatures**: Integrate with e-signature service
6. **Watermarks**: Add school logo watermark
7. **Batch Generation**: Generate marksheets for entire class at once
8. **Student Portal**: Students can view/download their own marksheets

### Performance Optimizations
1. **Caching**: Cache generated PDFs (1 day TTL)
2. **Background Jobs**: Generate marksheets asynchronously
3. **Compression**: Optimize PDF file size
4. **CDN**: Serve PDFs from CDN edge locations

## Troubleshooting

### Common Issues

**Issue**: "Marksheet not found"
- **Cause**: Marksheet snapshot not generated
- **Solution**: Click "Generate Marksheet" button after publishing results

**Issue**: "Result not published"
- **Cause**: Trying to generate marksheet before publishing
- **Solution**: Publish results first, then generate marksheet

**Issue**: PDF download not starting
- **Cause**: Browser popup blocker or React PDF error
- **Solution**: Check browser console, ensure @react-pdf/renderer is installed

**Issue**: Missing subject data
- **Cause**: Subject results not loaded properly
- **Solution**: Check API endpoint includes all related data

## Testing

### Manual Testing Checklist
- [ ] Generate term marksheet after compiling term results
- [ ] Verify all subject marks appear correctly
- [ ] Check GPA calculation matches database
- [ ] Verify NG status displays for failing students
- [ ] Test PDF download in different browsers
- [ ] Check landscape orientation for term marksheet
- [ ] Generate annual transcript after annual compilation
- [ ] Verify weighted marks calculation
- [ ] Check class rank appears (if set)
- [ ] Test portrait orientation for annual transcript
- [ ] Verify signature section appears
- [ ] Check date format is correct

### API Testing
```bash
# Generate term marksheet
curl -X POST http://localhost:3000/api/admin/secondary/marksheets \
  -H "Content-Type: application/json" \
  -d '{"termResultId": "cm..."}'

# Fetch marksheet details
curl http://localhost:3000/api/admin/secondary/marksheets/cm...
```

## Dependencies

```json
{
  "@react-pdf/renderer": "^4.3.0",
  "@tanstack/react-query": "^5.80.5",
  "lucide-react": "^0.513.0"
}
```

## Files Created/Modified

### New Files
- `src/components/secondary/SecondaryTermMarksheetPDF.tsx`
- `src/components/secondary/SecondaryAnnualMarksheetPDF.tsx`
- `src/components/secondary/SecondaryMarksheetDownload.tsx`
- `src/components/secondary/SecondaryMarksheetModal.tsx`
- `src/app/api/admin/secondary/marksheets/[id]/route.ts`
- `docs/SECONDARY_MARKSHEET_GENERATION.md`

### Modified Files
- `src/app/api/admin/secondary/marksheets/route.ts` (already existed)
- `prisma/schema.prisma` (SecondaryMarksheet model already existed)

## References

- **Primary Marksheet**: `src/components/shared/GradeSheetPDF.tsx`
- **Result Compilation**: `src/app/(admin)/admin/secondary/result-compilation/page.tsx`
- **API Responses**: `src/lib/response.ts`
- **Prisma Schema**: `prisma/schema.prisma`
