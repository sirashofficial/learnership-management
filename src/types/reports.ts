export interface DailyReport {
    date: Date;
    facilitator: string;
    group: string;

    // Attendance
    attendance: {
        present: string[];
        absent: { name: string; reason: string }[];
        late: { name: string; arrivalTime: string }[];
    };

    // Training
    modulesCovered: string;
    topicsCovered: string;
    activitiesCompleted: string[];

    // Assessments
    formativesCompleted: { studentName: string; formativeCode: string }[];

    // Notes
    observations: string;
    challengesFaced: string;
    followUpRequired: string;
}
