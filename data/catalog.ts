import splendor from "./games/splendor.json";
import dobble from "./games/dobble.json";
import rummikubClassic from "./games/rummikub-classic.json";
import ubongo from "./games/ubongo.json";
import klask from "./games/klask.json";
import coffeeRush from "./games/coffee-rush.json";
import davinciCode from "./games/davinci-code.json";
import dixit from "./games/dixit.json";
import saboteur from "./games/saboteur.json";
import halliGalliRinglding from "./games/halli-galli-ringlding.json";
import greatDalmuti from "./games/great-dalmuti.json";
import halliGalli from "./games/halli-galli.json";
import lobo77 from "./games/lobo-77.json";
import sixNimmt from "./games/6-nimmt.json";
import carcassonne from "./games/carcassonne.json";
import { gameDatasetSchema } from "../src/domain/games/schema";

/** Individually checked development records. Publication approval remains separate. */
export function loadGameDataset() {
  return gameDatasetSchema.parse([splendor, dobble, rummikubClassic, ubongo, klask, coffeeRush, davinciCode, dixit, saboteur, halliGalliRinglding, greatDalmuti, halliGalli, lobo77, sixNimmt, carcassonne]);
}
