customElements.define(
  "now-reading",
  class NowReading extends HTMLElement {
    constructor() {
      super();

      const iframe = document.createElement("iframe");
      iframe.srcdoc = html`
        <style>
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #222c2c;
            background-image: url("/components/now-reading/placeholder.png");
            background-size: 100%;
            image-rendering: pixelated;
          }
          .gr_grid_book_container img {
            position: absolute;
            width: 100vw;
            height: 100vh;
          }
        </style>
        <div id="gr_grid_widget_1745330698">
          <div class="gr_grid_container">
            <div class="gr_grid_book_container"></div>
          </div>
        </div>
        <script async src="https://www.goodreads.com/review/grid_widget/43850777.Lean's%20currently-reading%20book%20montage?cover_size=medium&hide_link=true&hide_title=true&num_books=1&order=a&shelf=currently-reading&sort=date_added&widget_id=1745330698" type="text/javascript" charset="utf-8"></script>
      `;
      iframe.tabIndex = -1;
      const span = document.createElement("span");
      span.textContent = "now reading";
      this.append(span, iframe);

      appendStyle(
        this.tagName,
        html`<style>
          now-reading {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-evenly;
            align-items: center;
            gap: 18px;
            width: 100%;
            max-width: 600px;
            max-height: 100%;
            font-style: normal;
            font-weight: bold;

            span {
              flex: 0 1 min-content;
              font-size: 93.75%;
              font-style: italic;
              color: var(--text2-clr);
              text-align: end;
            }

            iframe {
              min-width: 0;
              max-height: 100%; 
              flex: 0 1 96px;
              border: 0;
              border-radius: 6px;
              aspect-ratio: 1 / 1.5;
              pointer-events: none;
              transform: rotate(5deg);
            }
          }
        </style>`
      );
    }
  }
);