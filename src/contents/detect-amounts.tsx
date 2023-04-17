import { useMessage } from "@plasmohq/messaging/hook";

const DetectAmounts = () => {
  const { data } = useMessage(async (_req, res) => {
    console.debug("Detecting...");
    const textContent = getTextContent(document.body);
    const amounts = extractCurrencyAmounts(textContent);
    console.debug("Detected:", amounts);
    res.send({ amounts });
  });
  console.log({ data });
  return null;
};

export default DetectAmounts;

/** Extract any currency amounts from a string */
function extractCurrencyAmounts(textContent: string) {
  const regex = /[$£€¥]\s?([\d,]+(?:\.\d{1,2})?)/g;
  let match;
  const amounts = new Set<number>();
  while ((match = regex.exec(textContent)) !== null) {
    const amount = parseLocaleNumber(match[1]);
    if (!isNaN(amount)) {
      amounts.add(amount);
    }
  }
  const amountsArray = Array.from(amounts);
  amountsArray.sort((a, b) => b - a);

  return amountsArray;
}

/** Get all text content on a page, including shadow DOMs */
function getTextContent(element: Element | ShadowRoot) {
  let content = element.textContent || "";

  element.querySelectorAll("*").forEach((el) => {
    if (el.shadowRoot) {
      content += getTextContent(el.shadowRoot);
    }
  });
  return content;
}

/** Parse number according to user's locale */
function parseLocaleNumber(value: string, locales = navigator.languages) {
  //@ts-expect-error shut up TS!
  const example = Intl.NumberFormat(locales).format(1.1);
  const cleanPattern = new RegExp(`[^-+0-9${example.charAt(1)}]`, "g");
  const cleaned = value.replace(cleanPattern, "");
  const normalized = cleaned.replace(example.charAt(1), ".");

  return parseFloat(normalized);
}
