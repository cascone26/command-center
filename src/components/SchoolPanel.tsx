interface ScheduledCourse {
  code: string;
  name: string;
  dates: string;
  credits: number;
  doubled: boolean;
}

interface Props {
  school: {
    completedCourses: number;
    totalCourses: number;
    credits: number;
    completion: number;
    currentCourse: { code: string; name: string; currentTopic: number; totalTopics: number } | null;
    scheduled: ScheduledCourse[];
    graduationDate: string;
    daysUntilGrad: number;
    gpa: string;
  };
}

export function SchoolPanel({ school }: Props) {
  const coursePct = Math.round((school.completedCourses / school.totalCourses) * 100);
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

      {/* Degree Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "var(--text-mid)" }}>Degree Progress</span>
          <span className="mono" style={{ color: "var(--purple)" }}>
            {school.completion}%
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${school.completion}%`, background: "var(--purple)" }} />
        </div>
        <div
          className="flex items-center justify-between text-xs mt-1"
          style={{ color: "var(--text-dim)", fontSize: "10px" }}
        >
          <span>{school.credits} credits earned</span>
          <span>Grad: {school.graduationDate}</span>
        </div>
      </div>

      {/* Course Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: "var(--text-mid)" }}>Courses</span>
          <span className="mono" style={{ color: "var(--cyan)" }}>
            {school.completedCourses}/{school.totalCourses}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${coursePct}%`, background: "var(--cyan)" }} />
        </div>
      </div>

      {/* Current Course */}
      {school.currentCourse && (
        <div
          className="rounded-md p-2.5 mb-3"
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
            <div className="progress-fill" style={{ width: `${topicPct}%`, background: "var(--green)" }} />
          </div>
        </div>
      )}

      {/* Upcoming Schedule */}
      {school.scheduled.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1.5" style={{ color: "var(--text-mid)" }}>
            Upcoming
          </div>
          <div className="scroll-y space-y-1" style={{ maxHeight: "140px" }}>
            {school.scheduled.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{c.code}</span>
                  {c.doubled && (
                    <span
                      className="ml-1.5 mono"
                      style={{ fontSize: "9px", padding: "0 4px", borderRadius: "3px", background: "var(--yellow-dim)", color: "var(--yellow)" }}
                    >
                      doubled
                    </span>
                  )}
                  <div style={{ color: "var(--text-dim)", fontSize: "10px" }}>{c.name}</div>
                </div>
                <div className="text-right shrink-0 ml-2" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                  <div>{c.dates}</div>
                  <div>{c.credits}cr</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
