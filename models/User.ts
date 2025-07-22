
export class Workout {
  id: string;
  name: string;
  date: Date;
  durationMinutes: number;
  
  constructor(id: string, name: string, date: Date, durationMinutes: number) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.durationMinutes = durationMinutes;
  }
}

export class Log {
    id: string;
    diaryEntry: string;
    date: Date;
    workouts: Workout[];
    injuries: string[];

    constructor(id: string, diaryEntry: string, date: Date) {
        this.id = id;
        this.diaryEntry = diaryEntry;
        this.date = date;
        this.workouts = [];
        this.injuries = [];
    }
}

export class User {
  id: string;
  name: string;
  height: number; // in cm
  weight: number; // in kg
  logs: Log[]; // Diary-based: array of daily logs
  
  constructor(id: string, name: string, height: number, weight: number) {
    this.id = id;
    this.name = name;
    this.height = height;
    this.weight = weight;
    this.logs = [];
  }
  
  // Log management
  addLog(log: Log): void {
    this.logs.push(log);
  }
  
  removeLog(logId: string): void {
    this.logs = this.logs.filter(l => l.id !== logId);
  }
  
  getLogByDate(date: Date): Log | undefined {
    return this.logs.find(l => 
      l.date.toDateString() === date.toDateString()
    );
  }
  
  // Workout methods (working through logs)
  getAllWorkouts(): Workout[] {
    return this.logs.flatMap(log => log.workouts);
  }
  
  getWorkoutsByDateRange(startDate: Date, endDate: Date): Workout[] {
    return this.logs
      .filter(log => log.date >= startDate && log.date <= endDate)
      .flatMap(log => log.workouts);
  }
  
  // Stats
  get totalLogs(): number {
    return this.logs.length;
  }
  
  get totalWorkouts(): number {
    return this.getAllWorkouts().length;
  }
  
  get totalWorkoutMinutes(): number {
    return this.getAllWorkouts().reduce((total, workout) => 
      total + workout.durationMinutes, 0
    );
  }
}

export default User;
