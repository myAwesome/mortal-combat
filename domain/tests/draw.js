const { Draw } = require("../models/Draw");

describe("Draw", () => {
  test("draw8 has capacity 8 and creates 12 matches", () => {
    const draw8 = new Draw(8);
    expect(draw8.capacity).toBe(8);
    draw8.createMatches(8);
    expect(draw8.matches.size).toBe(12);
  });

  test("draw16 creates 32 matches", () => {
    const draw16 = new Draw(16);
    draw16.createMatches(16);
    expect(draw16.matches.size).toBe(32);
  });

  test("draw32 creates 80 matches", () => {
    const draw32 = new Draw(32);
    draw32.createMatches(32);
    expect(draw32.matches.size).toBe(80);
  });

  test("draw64 creates 192 matches", () => {
    const draw64 = new Draw(64);
    draw64.createMatches(64);
    expect(draw64.matches.size).toBe(192);
  });

  test("calcPlacesPriority(8) returns correct seeding order", () => {
    const placesPriority = Draw.calcPlacesPriority(8);
    expect(placesPriority[0]).toBe(1);
    expect(placesPriority[1]).toBe(8);
    expect(placesPriority[2]).toBe(4);
    expect(placesPriority[3]).toBe(5);
    expect(placesPriority[4]).toBe(6);
    expect(placesPriority[5]).toBe(3);
    expect(placesPriority[6]).toBe(7);
    expect(placesPriority[7]).toBe(2);
  });

  test("can disable third-place match in draw config", () => {
    const draw8 = new Draw(8, { drawConfig: { playThirdPlaceMatch: false, playPlacementBrackets: true } });
    draw8.createMatches(8);
    expect(draw8.matches.size).toBe(11);
  });

  test("can disable placement brackets (5th+ places) in draw config", () => {
    const draw8 = new Draw(8, { drawConfig: { playThirdPlaceMatch: true, playPlacementBrackets: false } });
    draw8.createMatches(8);
    expect(draw8.matches.size).toBe(8);
  });

  test("can disable both third-place and placement brackets", () => {
    const draw8 = new Draw(8, { drawConfig: { playThirdPlaceMatch: false, playPlacementBrackets: false } });
    draw8.createMatches(8);
    expect(draw8.matches.size).toBe(7);
  });
});
