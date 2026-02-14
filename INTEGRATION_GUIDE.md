/**
 * Integration Guide: Adding Module Progression to Student Details
 * 
 * This file shows how to integrate the ModuleProgressionPanel into StudentDetailsModal.
 * Add this as a new section in the StudentDetailsModal component.
 */

// 1. Import the component at the top of StudentDetailsModal.tsx
import ModuleProgressionPanel from './ModuleProgressionPanel';
import CreateAssessmentModal from './CreateAssessmentModal';

// 2. Add state for showing the panels
const [showModuleProgression, setShowModuleProgression] = useState(false);
const [showCreateAssessment, setShowCreateAssessment] = useState(false);

// 3. Add quick action button in the Quick Action Links section (around line 221)
<button
  onClick={() => setShowModuleProgression(!showModuleProgression)}
  className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
>
  <TrendingUp className="w-4 h-4" />
  {showModuleProgression ? 'Hide' : 'Show'} Module Progression
</button>

<button
  onClick={() => setShowCreateAssessment(true)}
  className="flex items-center gap-2 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors text-sm font-medium"
>
  <Plus className="w-4 h-4" />
  Create Assessment
</button>

// 4. Add the Module Progression section after the "Module Breakdown" section (around line 441)
{showModuleProgression && (
  <section>
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-teal-500" />
      Module Progression Timeline
    </h3>
    <ModuleProgressionPanel
      studentId={student.id}
      onModuleChange={() => {
        // Refresh student data if needed
        console.log('Module changed, refresh data');
      }}
    />
  </section>
)}

// 5. Add the CreateAssessmentModal at the end, before the closing fragment (around line 563)
{showCreateAssessment && (
  <CreateAssessmentModal
    isOpen={showCreateAssessment}
    onClose={() => setShowCreateAssessment(false)}
    studentId={student.id}
    onSuccess={() => {
      // Refresh assessments or progress data
      console.log('Assessment created successfully');
    }}
  />
)}

/**
 * Alternative: Tab-Based Interface
 * 
 * For a cleaner UI, you could replace the sections with tabs:
 * - Overview (current personal info + progress)
 * - Module Progression (ModuleProgressionPanel)
 * - Assessments (formatives list + create button)
 * - Attendance (attendance history)
 */

// Example tab state
const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'assessments' | 'attendance'>('overview');

// Tab buttons
<div className="flex gap-2 border-b border-gray-200">
  <button
    onClick={() => setActiveTab('overview')}
    className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-600'}`}
  >
    Overview
  </button>
  <button
    onClick={() => setActiveTab('modules')}
    className={`px-4 py-2 font-medium ${activeTab === 'modules' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-600'}`}
  >
    Module Progression
  </button>
  <button
    onClick={() => setActiveTab('assessments')}
    className={`px-4 py-2 font-medium ${activeTab === 'assessments' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-600'}`}
  >
    Assessments
  </button>
  <button
    onClick={() => setActiveTab('attendance')}
    className={`px-4 py-2 font-medium ${activeTab === 'attendance' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-600'}`}
  >
    Attendance
  </button>
</div>

// Tab content
{activeTab === 'overview' && (
  // Current personal info and progress sections
)}

{activeTab === 'modules' && (
  <ModuleProgressionPanel studentId={student.id} />
)}

{activeTab === 'assessments' && (
  // Assessments list + create button
)}

{activeTab === 'attendance' && (
  // Attendance history
)}
