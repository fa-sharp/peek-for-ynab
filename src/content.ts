export {};
// Request permission:
// chrome.permissions.request({
//     origins: ['https://*/*']
// })

window.addEventListener("load", () => {
  console.time("Extraction");
  const textContent = getTextContent(document);
  console.log({
    content: textContent,
    detected: extractCurrencyAmounts(textContent)
  });
  console.timeEnd("Extraction");
});

/** Extract any currency amounts from a string */
function extractCurrencyAmounts(textContent: string) {
  const regex = /[$£€¥]\s?(\d+(?:\.\d{1,2})?)/g;
  let match;
  const amounts = new Set<number>();
  while ((match = regex.exec(textContent)) !== null) {
    const amount = parseFloat(match[1]);
    if (!isNaN(amount)) {
      amounts.add(amount);
    }
  }

  return amounts;
}

/** Get all text content on a page, including shadow DOMs */
function getTextContent(document: Document | ShadowRoot) {
  let content =
    ("body" in document ? document.body.textContent : document.textContent) || "";

  Array.from(document.querySelectorAll("*")).forEach((el) => {
    if (el.shadowRoot) {
      content += getTextContent(el.shadowRoot);
    }
  });
  return content;
}
