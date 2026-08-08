const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateShortCode(
  length = 7
): string {

  let code = "";

  for (let i = 0; i < length; i++) {

    const randomIndex = Math.floor(
      Math.random() * CHARACTERS.length
    );

    code += CHARACTERS[randomIndex];
  }

  return code;
}