# YEHA Component & Pattern Reference Guide

## Quick Navigation

- [Form Components](#form-components)
- [Feedback Components](#feedback-components)
- [Container Components](#container-components)
- [Pattern Examples](#pattern-examples)
- [Accessibility Rules](#accessibility-rules)
- [Styling Conventions](#styling-conventions)

---

## Form Components

### FormInput (Text, Email, Password, Number)

**Location:** `src/components/ui/FormInput.tsx`

**Basic Usage:**
```tsx
import { FormInput } from '@/components/ui/FormInput';

<FormInput
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  required
/>
```

**With Validation:**
```tsx
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleChange = (e) => {
  const value = e.target.value;
  setEmail(value);
  
  // Validate on change (optional)
  if (!value.includes('@')) {
    setError('Please enter a valid email');
  } else {
    setError('');
  }
};

<FormInput
  label="Email"
  type="email"
  value={email}
  onChange={handleChange}
  error={error}
  success={!error && email.length > 0}
  helperText="We'll send a confirmation link"
  required
/>
```

**With Icon:**
```tsx
import { User } from 'lucide-react';

<FormInput
  label="Full Name"
  placeholder="John Doe"
  icon={<User className="w-4 h-4" />}
/>
```

**Props:**
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | string | undefined | Form label text |
| `type` | string | "text" | Input type (text, email, password, etc.) |
| `error` | string | undefined | Error message to display |
| `success` | boolean | false | Show success state |
| `helperText` | string | undefined | Helper text below input |
| `icon` | ReactNode | undefined | Icon to show on left |
| `required` | boolean | false | Show red asterisk |
| `disabled` | boolean | false | Disable input |
| `placeholder` | string | undefined | Input placeholder |
| `value` | string | undefined | Input value |
| `onChange` | function | undefined | Change handler |

**Accessibility:**
- Automatically links label with input via `id`
- Error messages connected via `aria-describedby`
- `aria-invalid` set when error present
- Support for screen readers

---

### Select/Dropdown (Use Native Select)

**IMPORTANT:** For dropdowns, use native HTML `<select>` with Tailwind's `.select` class:

```tsx
<select className="select" required>
  <option value="">-- Select a group --</option>
  <option value="group-a">Group A</option>
  <option value="group-b">Group B</option>
</select>
```

**If Custom Dropdown Needed:**
- File a task to create `SelectInput.tsx` component
- Do NOT create custom dropdown without proper ARIA implementation

---

### Textarea

**Usage:**
```tsx
<textarea 
  className="textarea"
  placeholder="Enter your notes..."
  rows={5}
/>
```

---

## Feedback Components

### Alert Component

**Location:** `src/components/ui/Alert.tsx`

**Success Alert:**
```tsx
import { Alert } from '@/components/ui/Alert';

<Alert
  variant="success"
  title="Assessment saved"
  description="Your grade has been recorded successfully"
  dismissible
/>
```

**Error Alert:**
```tsx
<Alert
  variant="error"
  title="Error saving assessment"
  description="Please check your connection and try again"
  dismissible
  onDismiss={() => clearError()}
/>
```

**Warning Alert:**
```tsx
<Alert
  variant="warning"
  title="Low attendance"
  description="This student's attendance is below 80%"
  dismissible
/>
```

**Info Alert:**
```tsx
<Alert
  variant="info"
  title="Pro tip"
  description="You can bulk-edit students by selecting multiple rows"
/>
```

**Props:**
| Prop | Type | Options | Notes |
|------|------|---------|-------|
| `variant` | string | success, error, warning, info | Alert type |
| `title` | string | - | Required alert title |
| `description` | string | - | Optional description |
| `dismissible` | boolean | - | Show close button |
| `onDismiss` | function | - | Called when dismissed |

**When to Use:**
- âœ… Operation success
- âœ… Form validation errors
- âœ… Important warnings
- âœ… Tips and information
- âŒ Don't use for transient notifications (use Toast instead - future component)

---

### Empty State Component

**Location:** `src/components/ui/EmptyState.tsx`

**Basic Usage:**
```tsx
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

{students.length === 0 && (
  <EmptyState
    icon={Users}
    title="No students enrolled"
    description="Add your first student to start tracking progress"
    action={{
      label: "Add Student",
      onClick: () => setShowForm(true)
    }}
  />
)}
```

**Without Action:**
```tsx
<EmptyState
  icon={FileText}
  title="No assessments submitted"
  description="Students will see their assessments here once submitted"
/>
```

**Props:**
| Prop | Type | Notes |
|------|------|-------|
| `icon` | LucideIcon | Icon to display (e.g., Users, FileText) |
| `title` | string | Main heading |
| `description` | string | Optional subheading |
| `action` | object | {label: string, onClick: function} |

**When to Use:**
- âœ… List is empty
- âœ… No search results
- âœ… Data not available
- âŒ Don't use for loading (use LoadingSkeleton)
- âŒ Don't use for errors (use ErrorState)

---

### Error State Component

**Location:** `src/components/ui/EmptyState.tsx`

**Usage:**
```tsx
import { ErrorState } from '@/components/ui/EmptyState';

{hasError && (
  <ErrorState
    title="Failed to load assessments"
    description="An error occurred while fetching data"
    action={{
      label: "Retry",
      onClick: () => refetch()
    }}
  />
)}
```

**When to Use:**
- âœ… Data fetch failed
- âœ… Operation error
- âœ… Server error (500, etc.)
- âŒ Don't use for form validation errors (use Alert)

---

### Loading Skeleton Component

**Location:** `src/components/ui/EmptyState.tsx`

**Usage:**
```tsx
import { LoadingSkeleton } from '@/components/ui/EmptyState';

{isLoading ? (
  <LoadingSkeleton count={3} />
) : (
  // Content
)}
```

**For Entire Section:**
```tsx
<div className="space-y-4">
  <LoadingSkeleton count={5} className="h-20" />
</div>
```

**Props:**
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `count` | number | 1 | Number of skeleton items |
| `className` | string | - | Custom styling |

---

### Tooltip Component

**Location:** `src/components/ui/Tooltip.tsx`

**Basic Usage:**
```tsx
import { Tooltip } from '@/components/ui/Tooltip';

<Tooltip content="Mark as complete" position="top">
  <button onClick={handleComplete}>âœ“</button>
</Tooltip>
```

**All Positions:**
```tsx
<Tooltip content="Top tooltip" position="top">Top</Tooltip>
<Tooltip content="Right tooltip" position="right">Right</Tooltip>
<Tooltip content="Bottom tooltip" position="bottom">Bottom</Tooltip>
<Tooltip content="Left tooltip" position="left">Left</Tooltip>
```

**With Custom Delay:**
```tsx
<Tooltip content="Long description..." delay={500}>
  <InfoIcon />
</Tooltip>
```

**Props:**
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `content` | string | - | Tooltip text (required) |
| `position` | string | "top" | top, right, bottom, left |
| `delay` | number | 200 | Delay in ms before showing |
| `children` | ReactNode | - | Element to attach tooltip to |

**When to Use:**
- âœ… Explain icon buttons
- âœ… Provide keyboard shortcut info
- âœ… Brief help text
- âŒ Don't use for help text in forms (use helperText prop)
- âŒ Don't use for essential information (make visible always)

---

## Container Components

### Card / Card Interactive

**Basic Card:**
```tsx
<div className="card p-6">
  <h3 className="font-semibold mb-3">Student Profile</h3>
  {/* Content */}
</div>
```

**Interactive Card:**
```tsx
<div 
  className="card-interactive p-6"
  onClick={() => openStudent(student.id)}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && openStudent(student.id)}
>
  <h3 className="font-semibold mb-3">{student.name}</h3>
  {/* Content */}
</div>
```

---

## Pattern Examples

### Form Submission Pattern

```tsx
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitSuccess, setSubmitSuccess] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setErrors({});

  try {
    const response = await fetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to save');

    setSubmitSuccess(true);
    setFormData({ name: '', email: '' });
    setTimeout(() => setSubmitSuccess(false), 3000);
  } catch (error) {
    setErrors({ submit: error.message });
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <form onSubmit={handleSubmit} className="space-y-4">
    {submitSuccess && (
      <Alert variant="success" title="Student added successfully" />
    )}

    {errors.submit && (
      <Alert variant="error" title="Error" description={errors.submit} />
    )}

    <FormInput
      label="Name"
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
      error={errors.name}
      required
    />

    <FormInput
      label="Email"
      type="email"
      value={formData.email}
      onChange={(e) => setFormData({...formData, email: e.target.value})}
      error={errors.email}
      required
    />

    <button 
      type="submit"
      disabled={isSubmitting}
      className="btn-primary"
    >
      {isSubmitting ? 'Saving...' : 'Save Student'}
    </button>
  </form>
);
```

### List with Empty State Pattern

```tsx
const [students, setStudents] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchStudents();
}, []);

const fetchStudents = async () => {
  try {
    const response = await fetch('/api/students');
    const data = await response.json();
    setStudents(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

return (
  <div className="space-y-4">
    {isLoading && <LoadingSkeleton count={5} />}

    {error && (
      <ErrorState
        title="Failed to load students"
        description={error}
        action={{ label: "Retry", onClick: fetchStudents }}
      />
    )}

    {!isLoading && !error && students.length === 0 && (
      <EmptyState
        icon={Users}
        title="No students"
        description="Start by adding your first student"
        action={{ label: "Add Student", onClick: () => {} }}
      />
    )}

    {!isLoading && !error && students.length > 0 && (
      <div className="space-y-3">
        {students.map(student => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    )}
  </div>
);
```

---

## Accessibility Rules

### Golden Rules

1. **Every interactive element needs an accessible name**
   ```tsx
   âŒ <button><Icon /></button>
   âœ… <button aria-label="Close">âœ•</button>
   ```

2. **Form inputs must have labels**
   ```tsx
   âŒ <input type="text" />
   âœ… <FormInput label="Name" />
   ```

3. **Keyboard navigation must work**
   ```tsx
   âŒ <div onClick={handler}>Click me</div>
   âœ… <button onClick={handler}>Click me</button>
   ```

4. **Color is not the only indicator**
   ```tsx
   âŒ <span className="text-red-600">Error</span>
   âœ… <Alert variant="error" title="Error message" />
   ```

5. **Focus must be visible**
   ```tsx
   âŒ *:focus { outline: 0; }  // NEVER do this!
   âœ… Use .focus-ring utility or focus-visible:ring-2
   ```

---

## Styling Conventions

### Spacing Scale

```css
/* 8px base unit */
p-1  = 0.25rem (4px)
p-2  = 0.5rem (8px)   â† Use this
p-3  = 0.75rem (12px)
p-4  = 1rem (16px)    â† Or this
p-6  = 1.5rem (24px)  â† Or this
p-8  = 2rem (32px)    â† Or this
```

**Use consistently:**
```tsx
âœ… pt-6 pb-6 pl-4 pr-4        (Consistent spacing)
âŒ pt-3 pb-5 pl-2 pr-8        (Inconsistent)
```

---

### Color Usage

**Text Colors:**
```tsx
âœ… text-slate-900          (On light background)
âœ… dark:text-white         (On dark background)
âœ… text-slate-500          (Secondary/muted text)
âŒ text-blue-600           (Unless it's a link)
```

**Background Colors:**
```tsx
âœ… bg-slate-50             (Light backgrounds)
âœ… dark:bg-slate-800       (Dark backgrounds)
âœ… bg-emerald-600          (Actions/CTA)
```

---

### Button Usage

```tsx
/* Primary action */
âœ… className="btn-primary"

/* Secondary action */
âœ… className="btn-secondary"

/* Dangerous action */
âœ… className="btn-danger"

/* Ghost/tertiary */
âœ… className="btn-ghost"
```

---

## File Organization

When creating new features, follow this structure:

```
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ feature/
â”‚   â”‚   â”œâ”€â”€ page.tsx           (Page component)
â”‚   â”‚   â””â”€â”€ layout.tsx         (Layout if needed)
â”‚
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ feature/
â”‚   â”‚   â”œâ”€â”€ FeatureForm.tsx    (Form component)
â”‚   â”‚   â”œâ”€â”€ FeatureList.tsx    (List component)
â”‚   â”‚   â””â”€â”€ FeatureCard.tsx    (Card component)
â”‚
â”œâ”€â”€ hooks/
â”‚   â””â”€â”€ useFeature.ts          (Custom hook)
â”‚
â””â”€â”€ types/
    â””â”€â”€ feature.ts            (TypeScript types)
```

---

## Common Questions

### Q: When should I use FormInput vs native input?
**A:** Always use FormInput for user-entered text. Only use native `<input>` for internal/admin fields.

### Q: Can I add custom styling to FormInput?
**A:** Use the `className` prop to add additional classes. The component uses Tailwind defaults.

### Q: How do I validate forms?
**A:** Use FormInput's `error` prop. Validation logic should be in parent component or custom hook.

### Q: Can I make tooltips appear on click?
**A:** Not yet - create an issue to add this feature.

### Q: What about loading states for buttons?
**A:** Use the `loading` prop on the Button component once implemented, or show disabled state.

---

## Deprecated Patterns

âŒ **Don't use these anymore:**
- Custom styled inputs without validation feedback
- Inline `className="text-red-600"` for errors
- No empty states in lists
- Missing ARIA labels on buttons
- Manual focus management

âœ… **Use new patterns instead:**
- FormInput with error prop
- Alert component for feedback
- EmptyState component
- aria-label and semantic HTML
- Built-in focus management

---

## Resources

- [The YEHA Design System](../UI_UX_IMPROVEMENTS.md)
- [Full Implementation Details](../UI_UX_IMPLEMENTATION_SUMMARY.md)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** February 12, 2026  
**Version:** 1.0

