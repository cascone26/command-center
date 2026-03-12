interface Props {
  school: {
    completedCourses: number;
    totalEstimated: number;
    currentCourse: { code: string; name: string; currentTopic: number; totalTopics: number } | null;
    graduationDate: string;
    daysUntilGrad: number;
    gpa: string;
  };
}

export function SchoolPanel({ school }: Props) {
  const pct = Math.round((school.completedCourses / school.totalEstimated) * 100);
  const topicPct = school.currentCourse
    ? Math.round((school.currentCourse.currentTopic / school.currentCourse.totalTopics) * 100)
    : 0;

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">School / GCU</span>
        <span className="stat-pill" style={{ background: "var(--purple-dim)", color: "var(--purple)" }}>
          {school.gpa} GPA
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "var(--text-mid)" }}>Degree Progress</span>
          <span className="mono" style={{ color: "var(--purple)" }}>
            {school.completedCourses}/{school.totalEstimated} courses
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%`, background: "var(--purple)" }} />
        </div>
        <div
          className="flex items-center justify-between text-xs mt-1"
          style={{ color: "var(--text-dim)", fontSize: "10px" }}
        >
          <span>{pct}% complete</span>
          <span>Grad: {school.graduationDate}</span>
        </div>
      </div>

      {school.currentCourse && (
        <div
          className="rounded-md p-2.5"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{school.currentCourse.code}</span>
            <span className="mono" style={{ color: "var(--text-dim)" }}>
              Topic {school.currentCourse.currentTopic}/{school.currentCourse.totalTopics}
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-mid)" }}>
            {school.currentCourse.name}
          </div>
          <div className="progress-track mt-2">
            <div className="progress-fill" style={{ width: `${topicPct}%`, background: "var(--cyan)" }} />
          </div>
        </div>
      )}
    </div>
  );
}
