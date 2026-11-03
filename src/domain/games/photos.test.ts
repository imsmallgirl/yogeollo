import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadGameDataset } from "../../../data/catalog";
import { gamePhotos, gamePhotoSchema, gamePhotosSchema, getGamePhoto } from "./photos";

describe("공개 라이선스 사진 기록", () => {
  it("실제 카탈로그에 속한 6장만 포함하고 출처·권리 정보를 보존한다", () => {
    const slugs = loadGameDataset().map((game) => game.facts.slug);
    const credits = readFileSync("public/game-photos/CREDITS.md", "utf8");
    expect(gamePhotos).toHaveLength(6);
    expect(readdirSync("public/game-photos").filter((file) => file.endsWith(".jpg")).sort()).toEqual(gamePhotos.map((photo) => `${photo.slug}.jpg`).sort());
    for (const photo of gamePhotos) {
      expect(slugs).toContain(photo.slug);
      const file = readFileSync(`public${photo.src}`);
      expect(createHash("sha256").update(file).digest("hex")).toBe(photo.sha256);
      expect(file.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
      for (const credit of [photo.creator, photo.title, photo.sourceUrl, photo.licenseUrl, photo.sha256]) expect(credits).toContain(credit);
    }
  });
  it("알 수 없는 게임에 다른 게임 사진을 대신 붙이지 않는다", () => {
    expect(getGamePhoto("dobble")).toBeNull();
    expect(getGamePhoto("unknown")).toBeNull();
  });
  it("권리 정보 누락·미확인·라이선스 불일치·외부 표시 경로를 거부한다", () => {
    const photo = gamePhotos[0];
    for (const override of [{ creator: "" }, { sourceUrl: "" }, { verifiedAt: undefined }, { verificationStatus: "UNCONFIRMED" }, { license: "All rights reserved" }, { licenseUrl: "https://example.invalid/" }, { src: "https://external.invalid/game.jpg" }, { src: "/game-photos/../secret.jpg" }]) {
      expect(gamePhotoSchema.safeParse({ ...photo, ...override }).success).toBe(false);
    }
    expect(gamePhotosSchema.safeParse([photo, photo]).success).toBe(false);
  });
});
