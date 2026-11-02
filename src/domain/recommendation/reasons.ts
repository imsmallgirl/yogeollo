import { difficultyLabels, moodLabels, type RecommendationPreferences } from "./preferences";
import { formatPlayTime } from "./time";
import type {
  RecommendationExplanation, RecommendationGame, TimeRelaxation, VerifiedEditorial,
} from "./types";

export function explainRecommendation(
  game: RecommendationGame,
  editorial: VerifiedEditorial | null,
  preferences: RecommendationPreferences,
  relaxation: TimeRelaxation | null,
): RecommendationExplanation[] {
  const facts = game.facts;
  const reasons: RecommendationExplanation[] = [{
    code: "PLAYERS", kind: "MATCH", message: `${preferences.playerCount}명이 플레이할 수 있어요.`,
  }];

  if (!editorial || editorial.bestPlayers.length === 0) {
    reasons.push({ code: "BEST_PLAYERS", kind: "INFO", message: "추천 인원은 아직 확인하지 못했어요." });
  } else if (editorial.bestPlayers.includes(preferences.playerCount)) {
    reasons.push({ code: "BEST_PLAYERS", kind: "MATCH", message: `${preferences.playerCount}명이 자체 검토한 추천 인원에 포함돼요.` });
  } else {
    reasons.push({ code: "BEST_PLAYERS", kind: "CAUTION", message: "플레이는 가능하지만 선택한 인원은 자체 추천 인원에 포함되지 않아요." });
  }

  reasons.push(relaxation ? {
    code: "TIME", kind: "CAUTION", message: relaxation.message,
  } : {
    code: "TIME", kind: "MATCH",
    message: `표기 시간 ${formatPlayTime(facts.minPlayTime, facts.maxPlayTime)}이 선택한 시간 구간 안에 있어요.`,
  });

  if (!editorial || editorial.moodTags.length === 0) {
    reasons.push({ code: "MOOD", kind: "INFO", message: "게임 분위기는 아직 검토하지 못했어요." });
  } else if (editorial.moodTags.includes(preferences.mood)) {
    reasons.push({ code: "MOOD", kind: "MATCH", message: `자체 검토한 분위기에 ‘${moodLabels[preferences.mood]}’이 포함돼요.` });
  } else {
    reasons.push({ code: "MOOD", kind: "CAUTION", message: "선택한 분위기와 자체 검토한 태그가 일치하지 않아요." });
  }

  if (preferences.difficulty !== "ANY") {
    if (!editorial?.difficulty) {
      reasons.push({ code: "DIFFICULTY", kind: "INFO", message: "난이도는 아직 검토하지 못했어요." });
    } else if (editorial.difficulty === preferences.difficulty) {
      reasons.push({ code: "DIFFICULTY", kind: "MATCH", message: `자체 난이도 ‘${difficultyLabels[editorial.difficulty]}’가 선택과 같아요.` });
    } else {
      reasons.push({
        code: "DIFFICULTY", kind: "CAUTION",
        message: `자체 난이도는 ‘${difficultyLabels[editorial.difficulty]}’로, 선택한 ‘${difficultyLabels[preferences.difficulty]}’와 달라요.`,
      });
    }
  }

  switch (editorial?.languageDependency) {
    case "NONE":
      reasons.push({ code: "LANGUAGE", kind: "MATCH", message: "게임 중 언어 의존도가 없는 것으로 검토됐어요. 규칙서 언어는 별도로 확인해 주세요." });
      break;
    case "LOW":
      reasons.push({ code: "LANGUAGE", kind: "MATCH", message: "게임 중 언어 의존도가 낮은 것으로 검토됐어요." });
      break;
    case "MEDIUM":
    case "HIGH":
      reasons.push(facts.koreanEdition === "CONFIRMED" ? {
        code: "LANGUAGE", kind: "INFO", message: "한국어판이 확인됐어요. 한국어판을 사용하면 게임 중 글을 한국어로 확인할 수 있어요.",
      } : {
        code: "LANGUAGE", kind: "CAUTION", message: "게임 중 글을 읽어야 할 수 있어요. 한국어판을 확인하지 못했으니 보유한 판본의 언어를 확인해 주세요.",
      });
      break;
    default:
      reasons.push({ code: "LANGUAGE", kind: "INFO", message: "게임 중 언어 의존도는 아직 확인하지 못했어요." });
  }

  const domesticMessage = {
    IN_STOCK: "출처 확인일에 국내 판매 재고가 확인됐어요. 현재 재고는 달라질 수 있어요.",
    LISTED: "국내 유통사의 상품 노출을 확인했어요. 실제 재고는 미확인이에요.",
    OUT_OF_STOCK: "국내 상품은 확인됐지만 출처 확인일에는 품절이었어요. 보유 여부를 확인해 주세요.",
    UNKNOWN: "국내 플레이 근거가 확인됐어요. 국내 판매 여부는 미확인이에요.",
  }[facts.domesticAvailability];
  reasons.push({
    code: "DOMESTIC_AVAILABILITY",
    kind: facts.domesticAvailability === "OUT_OF_STOCK" ? "CAUTION" : "INFO",
    message: domesticMessage,
  });

  return reasons;
}
