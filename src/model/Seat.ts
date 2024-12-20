export class Seat {
    login: string;
    id: number;
    team: string;
    created_at: string;
    last_activity_at: string;
    last_activity_editor: string;
    day: string; // New attribute

    constructor(data: any, day: string) {
        this.login = data.assignee.login;
        this.id = data.assignee.id;
        this.team = data.assigning_team ? data.assigning_team.name : '';
        this.created_at = data.created_at;
        this.last_activity_at = data.last_activity_at;
        this.last_activity_editor = data.last_activity_editor;
        this.day = day; // Set the day attribute
    }
}

export class TotalSeats {
    total_seats: number;
    seats: Seat[];

    constructor(data: any, day: string) {
        this.total_seats = data.total_seats;
        this.seats = data.seats.map((seat: any) => new Seat(seat, day));
    }
}