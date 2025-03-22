export type ScriptSegment = {
  speaker: 'Alex' | 'Morgan';
  text: string;
};

export const cryptoNewsScript: ScriptSegment[] = [
  {
    speaker: 'Alex',
    text: "Welcome to Crypto Daily, your premier source for all things cryptocurrency! I'm Alex, joined today by my co-host Morgan. We've got some exciting developments to cover in today's show."
  },
  {
    speaker: 'Morgan',
    text: 'Thanks, Alex! The crypto market has been on quite a rollercoaster lately. Bitcoin has shown remarkable resilience, hovering around the $62,000 mark despite recent regulatory challenges.'
  }
]; 