
export class Workout {
  id: string;
  name: string;
  date: Date;
  // Duration-based workout (e.g., cardio, yoga)
  durationMinutes?: number;
  // Sets/reps-based workout (e.g., weight training)
  sets?: number;
  reps?: number;
  // Optional weight for strength training
  weight?: number; // in kg
  // Calories burned during the workout (mandatory)
  calories: number;
  
  constructor(
    id: string, 
    name: string, 
    date: Date, 
    options: {
      durationMinutes?: number;
      sets?: number;
      reps?: number;
      weight?: number;
      calories: number; // Now mandatory
    }
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.durationMinutes = options.durationMinutes;
    this.sets = options.sets;
    this.reps = options.reps;
    this.weight = options.weight;
    this.calories = options.calories;
  }

  // Helper methods to determine workout type
  get isDurationBased(): boolean {
    return this.durationMinutes !== undefined && this.durationMinutes > 0;
  }

  get isSetsBased(): boolean {
    return this.sets !== undefined && this.sets > 0;
  }

  // Get a readable description of the workout
  get description(): string {
    let desc = '';
    if (this.isDurationBased) {
      desc = `${this.name} - ${this.durationMinutes} minutes`;
    } else if (this.isSetsBased) {
      desc = `${this.name} - ${this.sets} sets`;
      if (this.reps) desc += ` of ${this.reps} reps`;
      if (this.weight) desc += ` @ ${this.weight}kg`;
    } else {
      desc = this.name;
    }
    
    // Always show calories since it's mandatory
    desc += ` (${this.calories} cal)`;
    
    return desc;
  }
}

export class Log {
    id: string;
    diaryEntry: string;
    date: Date;
    workouts: Workout[];
    injuries: string[];
    suggestions: string[]; // Array of suggestion strings

    constructor(id: string, diaryEntry: string, date: Date, suggestions: string[] = []) {
        this.id = id;
        this.diaryEntry = diaryEntry;
        this.date = date;
        this.workouts = [];
        this.injuries = [];
        this.suggestions = suggestions;
    }
}

export class FeaturedWorkout {
  id: string;
  name: string;
  durationMinutes?: number; // For cardio/yoga workouts
  sets?: number; // For strength training
  reps?: number; // For strength training
  weight?: number; // For strength training (in kg)
  difficultyLevel: 'all level' | 'beginner' | 'intermediate' | 'advanced';
  estimatedCalories?: number;
  description?: string;

  constructor(
    id: string,
    name: string,
    difficultyLevel: 'all level' | 'beginner' | 'intermediate' | 'advanced',
    options: {
      durationMinutes?: number;
      sets?: number;
      reps?: number;
      weight?: number;
      estimatedCalories?: number;
      description?: string;
    } = {}
  ) {
    this.id = id;
    this.name = name;
    this.difficultyLevel = difficultyLevel;
    this.durationMinutes = options.durationMinutes;
    this.sets = options.sets;
    this.reps = options.reps;
    this.weight = options.weight;
    this.estimatedCalories = options.estimatedCalories;
    this.description = options.description;
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
      total + (workout.durationMinutes || 0), 0
    );
  }
}

export default User;
