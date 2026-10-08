# Backend Integration Guide

## API Endpoint
`https://green-tarsier-764009.hostingersite.com/graphql`

## Features to Integrate

### 1. About Us Page - Company Profile Downloads
**Query**: `COMPANY_PROFILE_QUERY`
- Fetch company profile files (English & Arabic PDFs)
- Display download cards with file size formatting
- Handle missing files gracefully (fileNode can be null)
- Format fileSize from bytes to MB/GB

### 2. Contact Us Forms
**Mutation**: `SUBMIT_INQUIRY`
- Service Inquiry (action: "service_inquiry")
- Project Inquiry (action: "project_inquiry")
- Media Inquiry (action: "media_inquiry")

**Important Notes**:
- Always check `success` field, not just HTTP status
- Validate response for `validationErrors` array
- Add honeypot field `website` (hidden, always empty)
- Add Turnstile token field for bot protection
- Rate limit: 5 submissions per IP per 10 minutes
- Submit from browser, NOT from Next.js server (IP sharing issue)

### 3. Solutions Page
**Query**: `SOLUTIONS_QUERY`
- Fetch all solutions/pillars
- Display featured images
- Include SEO metadata for each solution

### 4. Industries Page
**Query**: `INDUSTRIES_QUERY`
- Fetch all industries
- Display sector services and FAQs
- Include procurement items
- Add SEO metadata

### 5. Home Page - Partners/Clients Logos
**Query**: `CLIENTS_QUERY`
- Fetch client logos for marquee/carousel
- Display in logo grid

### 6. Hub Pages (CTA sections)
**Query**: `HUBS_QUERY`
- Case Studies Hub settings
- Industries Hub settings
- Solutions Hub settings

## SEO Integration

Every content node includes an `seo` object with:
- `title` - Page title (already includes site name)
- `metaDesc` - Meta description
- `canonical` - Canonical URL
- `metaRobotsNoindex` - Currently "noindex" (dev mode)
- `opengraphTitle` - OG title
- `opengraphDescription` - OG description
- `opengraphImage` - OG image with sourceUrl
- `schema.raw` - JSON-LD as string (inject as-is)

**Important**: Every page currently returns `noindex`. This will flip at launch.

## Error Handling

### Form Validation
```typescript
if (!response.success) {
  response.validationErrors.forEach(error => {
    // Map error.field to input element
    // Show error.message next to field
  });
}
```

### Empty Fields
ACF fields can be null. Always guard:
```typescript
(service.serviceCoreContent?.approachSteps ?? []).map(...)
```

### File Downloads
Check node exists before accessing mediaItemUrl:
```typescript
if (data?.node) {
  const url = data.node.mediaItemUrl;
  const size = data.node.fileSize;
}
```

## Testing Notes
- Render service pages with full content
- Test pages with all fields empty (quality & analytics)
- Test long titles and repeaters (RPO entry)
- Validate JSON-LD with Google's Rich Results Test
- Test form submissions (5 per IP, 10 min window)
- Confirm Arabic metadata renders correctly
