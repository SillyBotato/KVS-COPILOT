# KVS Gateway

The website name must be exactly: “PM SHRI KENDRIYA VIDYALAYA”. Do not include any regional, city, district, state, branch, school code, KV code, UDISE code, or location-specific name anywhere on the website. Do not use names such as Rewari, Rohini, Delhi, etc.
Even though the attached screenshots contain the name “Rewari” and other school-specific details, treat those only as visual layout references. Do not copy any regional or school-specific text from the screenshots.
Create a frontend-only demo website for a hackathon video demonstration.

The website should visually recreate the layout, appearance, spacing, colors, typography, navigation style, dropdown behavior, and table design of the KVS school website shown in the reference screenshots.

IMPORTANT:

The main priority is VISUAL ACCURACY to the reference screenshots.

Do not redesign the website into a modern SaaS dashboard.

Do not use excessive rounded cards, gradients, animations, glassmorphism, or modern dashboard components.

The website should look like a traditional Indian government/educational institution portal, closely matching the reference images.

====================================================

OVERALL WEBSITE

====================================================

Create a scrollable desktop website with the following structure:

1. Thin top utility bar

2. Large institutional KVS-style header

3. Horizontal navigation menu

4. Breadcrumb area

5. Page heading

6. Large enrollment statistics table

7. Page should be vertically scrollable

The visual proportions should closely resemble the reference screenshots.

====================================================

TOP UTILITY BAR

====================================================

Create a thin bar at the top.

Left side:

"Ministry of Education"

Right side:

Small simple icons/buttons similar to the reference for:

- Login

- Search

- Accessibility

- Sitemap

- Font size

These do not need real functionality.

====================================================

MAIN HEADER

====================================================

Create a large header with a blue-to-teal gradient similar to the reference.

LEFT SIDE:

Create a KVS-style institutional logo/emblem area.

Next to it display:

"PM SHRI KENDRIYA VIDYALAYA"

Below it:

"An autonomous body under the Ministry of Education, Government of India"

IMPORTANT:

Do NOT include any specific school name.

Do NOT include:

- Rewari

- Rohini

- Delhi

- Any city

- Any KV code

- Any UDISE code

- Any school-specific information

The website should simply look like a generic KVS portal.

RIGHT SIDE:

Add a simple educational/institutional logo area similar in visual weight and placement to the reference.

====================================================

NAVIGATION BAR

====================================================

Below the header, create a horizontal navigation bar closely matching the reference.

Navigation items:

Home Page

About Us ▼

Academic ▼

Administration ▼

Enrollment Statistics ▼

Activities ▼

Gallery ▼

Online Fees

Alumni

☰

Use the same type of blue/teal background and white/light text as the reference.

====================================================

ENROLLMENT STATISTICS DROPDOWN

====================================================

The "Enrollment Statistics" item must be clickable.

When clicked, show a dropdown directly below it, visually similar to the reference screenshot.

Dropdown options:

Class and Social Category Wise Enrolment Position

Admission Category Wise Enrollment Status

Transfer Certificate Issued

Student Vacancy

The dropdown should use:

- Dark blue background

- White text

- Clear horizontal separators

- Hover state similar to a government website navigation menu

All options should be clickable.

ONLY the first option needs to display a fully developed page:

"Class and Social Category Wise Enrolment Position"

The other three options can simply show their respective page heading.

====================================================

MAIN FUNCTIONAL PAGE

====================================================

When the user clicks:

"Class and Social Category Wise Enrolment Position"

Display a page closely matching the reference screenshot.

At the top:

Breadcrumb:

Home Page > Enrollment Statistics > Class and Social Category Wise Enrolment Position

Below that, use a large page heading:

Class and Social Category Wise Enrolment Position

The spacing, font size and positioning should closely resemble the screenshot.

====================================================

ENROLLMENT TABLE

====================================================

Create a large full-width table similar to the reference.

Use:

- Dark navy/charcoal header background

- Light text in the header

- Large readable column labels

- Thin borders between cells

- White/light grey table body

- Alternating subtle row backgrounds

- Government portal styling

- Wide table with horizontal scrolling if required

The columns must be:

Class

Number

of

sections

authorized

capacity

Total

Enrolled

Students

boys

girls

scheduled

caste

Scheduled

Tribes

Other

Backward

Classes

disabled

General

General

minorities

[includes

Muslims]

The header labels should wrap across multiple lines similarly to the reference.

====================================================

INITIAL TABLE STATE

====================================================

IMPORTANT:

The enrollment table must initially contain NO numerical data.

Do not use:

- Fake student counts

- Demo values

- 0 values

- Random placeholder numbers

However, the class rows should still exist so that the table visually looks like the real KVS enrollment table.

Create rows for:

XI Science

XI Commerce

XI Art.

X

IX

VIII

VII

VI

V

IV

III

II

I

All cells other than the Class column should initially be blank.

For example:

XI Science | blank | blank | blank | blank | blank | blank ...

This is important because, during the hackathon video demo, the table will initially appear empty and will later be populated with data from the second demo website.

====================================================

SCROLLING

====================================================

Make the page vertically scrollable.

Make the table horizontally scrollable if the screen width is too small.

Include a visible horizontal scrollbar similar to the reference screenshot when appropriate.

The overall experience should feel like navigating a real government school portal.

====================================================

PLACEHOLDER SECTIONS

====================================================

The other Enrollment Statistics dropdown options:

- Admission Category Wise Enrollment Status

- Transfer Certificate Issued

- Student Vacancy

Only need basic pages with:

- Same header

- Same navigation

- Correct breadcrumb

- Correct page heading

- Empty/simple content area

Do not spend design complexity on these pages.

====================================================

VISUAL PRIORITY

====================================================

Prioritize the following in this exact order:

1. Match the reference screenshots visually.

2. Match the header proportions.

3. Match the navigation bar.

4. Match the Enrollment Statistics dropdown.

5. Match the typography and spacing.

6. Match the large dark-header enrollment table.

7. Keep the table initially empty.

8. Make the page look convincing during a screen-recorded hackathon demo.

Do not create a polished startup dashboard.

Do not add unnecessary cards, charts, analytics, statistics, modern UI widgets, or AI features.

This website is only a controlled visual demo portal that will be shown in a hackathon demonstration video.

The final result should look as close as reasonably possible to the provided KVS website reference screenshots while remaining a generic KVS portal with no regional or school-specific identity.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kvs-demo-vision.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b4853f8-27e1-4916-92ef-e1555fc33294).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
