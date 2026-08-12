import type { Ticker } from "../shared/contracts.ts";
import { O_COMPANY, BRKB_COMPANY } from "../shared/fixtures.ts";

export function getCompany(ticker: Ticker) {
  return ticker === "O" ? O_COMPANY : BRKB_COMPANY;
}
