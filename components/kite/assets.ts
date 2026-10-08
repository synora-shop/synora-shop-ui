/**
 * The file's own images, by what they are. Each is public/kite/<hash>.png —
 * the bytes the designer placed, named by their Figma hash (scripts/figma/images.mjs).
 */
const at = (hash: string) => `/kite/${hash}.png`;

export const KITE_ICON = {
  search: at("7868aa3e5e27fc001a8d780ec8bd4ddc596e7e9b"),
  user: at("8892334c33ada3235a6f8929adc21254326e005b"),
  bag: at("6e25b18de66e66a3c5e4d281eafe7470d5a730a4"),
  menu: at("afac7a140653c2ddfb797d8b2d18a1d8834a998a"),
} as const;

export const KITE_IMG = {
  newYork: at("a42954299d52ef22b8c139b86dd57cbd5c176144"),
  losAngeles: at("ab8154c46ff6a3b9331b2ab8adc3c0310f25ff98"),
  pieceCloak: at("ae520783ab263b34170ec82dfc91d3cb82b750e5"),
  pieceWall: at("dce87de5cf3c53bcde4883753b09c9ea95288237"),
  // The curated collage, in the file's order of placement.
  curated1: at("9cd35c42312800bc5a600321ed0b512d64943f4a"),
  curated2: at("14a79d61126ebd6ebf8c0bd1ebd637dd8b55ea85"),
  curated3: at("be010254f53b9029ed43f472f1cce3b156de7aa9"),
  curated4: at("29701f0c70efa399d3193ba0a6be94b2bb0dc8bd"),
  curated5: at("dc8432a67c78f88e178ae068ab038b9176fc99b6"),
  curated6: at("dd62b62bb1c092ac85ac52ad7a0defa15f682515"),
  curated7: at("81da0ecf8494d0d6aa9d111d5830709228c68371"),
  // The newsletter: the featured story's photograph, then the four stories'.
  storyMain: at("e274be32adb831ba35c2dda6a8787561b7e400c3"),
  story2: at("3defd6c656b089a25ca82f5050d1be8bc89d631f"),
  story3: at("a7e3a8832b22d9b41b2bf54ed59ce8ff45194f71"),
  story4: at("2654658034826ce17fc9f2d06f6e81722c45896a"),
  story5: at("462e4828356bf43b2ed32fa75742f520af2f8582"),
  aboutPortrait: at("bb01f38174f6b9e3fa6478daa642911e98b3f122"),
  aboutHands: at("c4deaa8870b43dd31bd0d175c39229fd280469e4"),
  // Upcoming, in the file's order of placement.
  upcoming1: at("9fc2c23a0bb336177d40335262e683822bf83c97"),
  upcoming2: at("f58f874b0d959254c7f91664e2d0d13db367c6ac"),
  upcoming3: at("47099af78b6389c27816b4cb8709b47c3e7ff40b"),
  upcoming4: at("619b592b81f04df58e8da03ccaefcc12c809e323"),
  upcoming5: at("38d13c89516d5c2bfcda5de982d1515825f88a77"),
  upcoming6: at("0f36ad0f7ef698defb408deda1d79c51da5df495"),
  journey: at("7df3f54721ce6218ef43d80a57ea9782a24c6f60"),
  // The product page: the shoe from the front, then its three other views.
  shoe: at("71cc03f852110d2ccf3863036a1a601233042e6d"),
  shoeSide: at("f6b572b9164f20ab93b60fe0f891cbc6a1cc3e06"),
  shoePair: at("141bd5c292d12deb2aa9f152d488e468b3b70f02"),
  shoeWorn: at("0b4eaa605b7da70d1cfd25fb025cb138f6a9241e"),
  // "Style with": three pieces.
  styleTrousers: at("14a06c3205245ddb6eaf6b05e1df32c85e953cee"),
  styleShirt: at("c0f4fe1ab275fd0abeb507d3075a4f8f13311af0"),
  styleCoat: at("75d9d56acb3f97386aff47df406bcce831b31ed8"),
} as const;
