class BreakdownData {
    language: string;
    editor: string;
    suggestions_count: number;
    acceptances_count: number;
    lines_suggested: number;
    lines_accepted: number;
    active_users: number;
    // chat_acceptances: number;
    // chat_turns: number;
    // active_chat_users: number;
  
    constructor(data: any) {
      this.language = data.language;
      this.editor = data.editor;
      this.suggestions_count = data.suggestions_count;
      this.acceptances_count = data.acceptances_count;
      this.lines_suggested = data.lines_suggested;
      this.lines_accepted = data.lines_accepted;
      this.active_users = data.active_users;
      // this.chat_acceptances = data.chat_acceptances || 0;
      // this.chat_turns = data.chat_turns || 0;
      // this.active_chat_users = data.active_chat_users || 0;
    }
  }
  
  export class Metrics {
    day: string;
    total_suggestions_count: number;
    total_acceptances_count: number;
    total_lines_suggested: number;
    total_lines_accepted: number;
    total_active_users: number;
    total_chat_acceptances: number;
    total_chat_turns: number;
    total_active_chat_users: number;
    breakdown: BreakdownData[];
  
    constructor(data: any) {
      this.day = data.day;
      this.total_suggestions_count = data.total_suggestions_count;
      this.total_acceptances_count = data.total_acceptances_count;
      this.total_lines_suggested = data.total_lines_suggested;
      this.total_lines_accepted = data.total_lines_accepted;
      this.total_active_users = data.total_active_users;
      this.total_chat_acceptances = data.total_chat_acceptances || 0;
      this.total_chat_turns = data.total_chat_turns || 0;
      this.total_active_chat_users = data.total_active_chat_users || 0;
      this.breakdown = data.breakdown.map((item: any) => new BreakdownData(item));

      // add log to check the breakdown data
      //console.log('Metrics breakdown:', JSON.stringify(this.breakdown, null, 2));
    }
  }