const fs = require('fs');

const filePath = 'c:/Users/LATITUDE 5400/Downloads/Learnership Management/src/app/groups/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const newGroupCard = `function GroupCard({ group, viewMode, onEdit, onArchive, onAddStudents, onView, onQuickView, isSelected, onSelect, actualProgress }: GroupCardProps) {
  const router = useRouter();
  const studentCount = getGroupStudentCount(group);
  const attendanceRate = group.attendanceRate || 0;
  const displayName = formatGroupNameDisplay(group.name || '');

  // Extract rollout plan from notes
  const rolloutPlan = resolveRolloutPlan(group);
  const rolloutStartDate = getPlanStartDate(rolloutPlan, group.startDate);
  const rolloutEndDate = getPlanEndDate(rolloutPlan, group.endDate);
  const hasLegacyRolloutPlan = Boolean(group?.rolloutPlan);

  // Get current module info and credit completion
  const currentModule = getCurrentModuleInfo(rolloutPlan);
  const creditProgress = getCreditCompletion(rolloutPlan);
  const resolvedActualProgress = actualProgress || group.actualProgress;
  const actualPercent = resolvedActualProgress?.avgPercent || 0;
  const performanceStatus = getPerformanceStatus(creditProgress.percentage, actualPercent, Boolean(rolloutPlan));

  const handleExportReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(\`/api/reports/group-progress?groupId=\${group.id}&format=csv\`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`group-\${group.name.replace(/[^a-z0-9]/gi, '_')}-progress.csv\`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        className={\`flex items-center justify-between p-4 bg-slate-50 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer \${isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}\`}
      >
        {onSelect && (
          <div className="flex items-center mr-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
            />
          </div>
        )}
        <Link href={\`/groups/\${group.id}\`} className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">{formatGroupNameDisplay(group.name)}</h4>
              {!hasLegacyRolloutPlan && (
                <span
                  className="bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-yellow-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                >
                  ⚠️ No rollout plan
                </span>
              )}
            </div>
            {group.facilitator && (
              <p className="text-sm text-slate-600">Facilitator: {group.facilitator.name}</p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{studentCount}</p>
            <p className="text-xs text-slate-600">Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{attendanceRate}%</p>
            <p className="text-xs text-slate-600">Attendance</p>
          </div>

          {/* Dual Progress Bars (Projected + Actual) */}
          <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
            {/* Current Module Label */}
            {rolloutPlan && currentModule.label && (
              <p className="text-xs font-medium text-slate-700">
                {currentModule.label}
              </p>
            )}

            {/* Projected */}
            {rolloutPlan && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-14 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Plan</span>
                <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all" style={{ width: \`\${creditProgress.percentage}%\` }} />
                </div>
                <span className="text-[10px] font-semibold text-teal-700 whitespace-nowrap w-20 text-right">
                  {creditProgress.percentage}% ({creditProgress.completed}/{TOTAL_CREDITS})
                </span>
              </div>
            )}

            {/* Actual */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-14 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Real</span>
              <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all" style={{ width: \`\${actualPercent}%\` }} />
              </div>
              <span className="text-[10px] font-semibold text-blue-700 whitespace-nowrap w-20 text-right">
                {actualPercent}% ({resolvedActualProgress?.avgCredits || 0}/{TOTAL_CREDITS})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onAddStudents}
              className="p-2 hover:bg-teal-100 text-teal-600 rounded-lg transition-colors"
              aria-label="Add Students"
            >
              <UserPlus className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={onQuickView}
              className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
              aria-label="Quick View"
            >
              <Info className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
              aria-label="Edit Group"
            >
              <Edit2 className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              data-testid="archive-group-button"
              onClick={onArchive}
              className="p-2 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
              aria-label="Archive Group"
            >
              <Archive className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={handleExportReport}
              className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
              aria-label="Export Progress Report"
            >
              <Download className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={\`bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 hover:shadow-lg transition-all overflow-hidden relative \${isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'border-slate-200 dark:border-slate-700'
        }\`}
    >
      {onSelect && (
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-6 h-6 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
          />
        </div>
      )}
      <Link href={\`/groups/\${group.id}\`} className="p-4 cursor-pointer block">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 cursor-pointer transition-colors"
                >
                  {formatGroupNameDisplay(group.name)}
                </h4>
                {!hasLegacyRolloutPlan && (
                  <span
                    className="bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-yellow-200 transition-colors"
                  >
                    ⚠️ No rollout plan
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {rolloutStartDate ? \`Started \${rolloutStartDate.toLocaleDateString()}\` : 'Start date not set'}
                {rolloutEndDate ? \` • Ends \${rolloutEndDate.toLocaleDateString()}\` : ''}
              </p>
              {/* Rollout Status Badge */}
              {renderStatusBadge(performanceStatus)}
            </div>
          </div>
        </div>
      </Link>

      {group.facilitator && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 px-4">
          Facilitator: {group.facilitator.name}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4 px-4">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{studentCount}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Students</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{attendanceRate}%</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Attendance</p>
        </div>
      </div>

      {/* Current Module & Progress Bars */}
      <div className="mb-4 space-y-3 px-4">
        {/* Current Module Label */}
        {rolloutPlan && currentModule.label && (
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {currentModule.label}
          </p>
        )}

        {/* Projected Progress Bar (from rollout plan dates) */}
        {rolloutPlan && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Projected
              </span>
              <span className="font-semibold text-teal-700 dark:text-teal-300">
                {creditProgress.percentage}% ({creditProgress.completed}/{TOTAL_CREDITS})
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300"
                style={{ width: \`\${creditProgress.percentage}%\` }}
              />
            </div>
          </div>
        )}

        {/* Actual Progress Bar (from real assessment data) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Actual
            </span>
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              {actualPercent}% ({resolvedActualProgress?.avgCredits || 0}/{TOTAL_CREDITS})
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
              style={{ width: \`\${actualPercent}%\` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-4 pt-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onAddStudents}
          className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <UserPlus className="w-4 h-4" />
          Add
        </button>
        <button
          onClick={onQuickView}
          className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Quick View"
        >
          <Info className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onArchive}
          className="py-2 px-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Archive"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          onClick={handleExportReport}
          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          title="Export Report"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}`;

// Robust replacement: find the function by its starting line and replace until its closing brace pattern
// Since I know the function is broken, I'll use a broad regex to match from the start of GroupCard to the next large structure
const startPattern = /function GroupCard\({\s*group,\s*viewMode,\s*onEdit,\s*onArchive,\s*onAddStudents,\s*onView,\s*onQuickView,\s*isSelected,\s*onSelect,\s*actualProgress\s*}:\s*GroupCardProps\s*\) {/;
const endPattern = /\n}\s*(?=\s*interface MergeGroupsModalProps)/;

const splitContent = content.split(startPattern);
if (splitContent.length > 1) {
    const afterStart = splitContent[1];
    const finalSplit = afterStart.split(endPattern);
    if (finalSplit.length > 1) {
        content = splitContent[0] + newGroupCard + finalSplit.slice(1).join('\\n}');
    }
}

fs.writeFileSync(filePath, content);
console.log('Successfully replaced GroupCard function');
