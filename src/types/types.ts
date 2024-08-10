export interface Route {
    from: string;
    to: string;
    departure: TrainTime;
    arrival: TrainTime;
    line: string;
    type: string;
    duration: number;
}

export interface RoutesData {
    stations: string[];
    routes: Route[];
}

export class TrainTime {
    hours: number;
    minutes: number;
    overhang: number; // Cumulative overhang (total days passed)
  
    constructor(hours: number, minutes: number, overhang: number = 0) {
      this.hours = hours;
      this.minutes = minutes;
      this.overhang = overhang;
      this.normalizeTime();
    }
  
    static fromString(timeString: string): TrainTime {
      const [hours, minutes] = timeString.split(':').map(Number);
      return new TrainTime(hours, minutes);
    }
  
    private normalizeTime() {
      while (this.minutes >= 60) {
        this.minutes -= 60;
        this.hours += 1;
      }
      while (this.hours >= 24) {
        this.hours -= 24;
        this.overhang += 1;
      }
    }
  
    addTime(other: TrainTime): TrainTime {
      const newHours = this.hours + other.hours;
      const newMinutes = this.minutes + other.minutes;
      const newOverhang = this.overhang + other.overhang;
      return new TrainTime(newHours, newMinutes, newOverhang);
    }
  
    compareTo(other: TrainTime): number {
      const totalMinutesThis = this.hours * 60 + this.minutes + this.overhang * 24 * 60;
      const totalMinutesOther = other.hours * 60 + other.minutes + other.overhang * 24 * 60;
      return totalMinutesThis - totalMinutesOther;
    }
  
    toString(): string {
      const formattedHours = this.hours.toString().padStart(2, '0');
      const formattedMinutes = this.minutes.toString().padStart(2, '0');      
      if(this.overhang>0){
        return `${formattedHours}:${formattedMinutes} (+${this.overhang})`;
      }
      else{
        return `${formattedHours}:${formattedMinutes}`;
      }
    }
  }
  