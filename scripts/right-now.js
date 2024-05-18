
  import { BaseElement } from "/lib/base_element.mjs";

  customElements.define(
    "right-now-client",
    class RightNow extends BaseElement {
      constructor() {
        super();

        this.visibilityListener({
          show: () => {
            if (this.shown) return;
            this.shown = true;
            this.onShow();
          },
        });
      }

      onShow() {
        this.init();
      }

      init() {
        // resist the temptation to import moment.js
        const now = new Date();
        const offset =
          now.getUTCMonth() >= 3 && now.getUTCMonth() < 9 ? 10 : 11;
        const localHours = now.getUTCHours() + offset;
        const day = (now.getUTCDay() + (localHours >= 24)) % 7;

        const status = getStatus(localHours % 24, day);

        const part0 = getRightNowText();
        const part1 = status.text;

        const localTime =
          (localHours % 24) +
          ":" +
          now.getUTCMinutes().toString().padStart(2, "0");
        const part2 = `My local time is ${localTime}`;

        this.querySelector(".right-now-emoji").textContent = status.emoji;
        this.querySelector(".right-now-status").textContent = part0 + part1;
        this.querySelector(".right-now-time").textContent = part2;
      }
    }
  );

  function getRightNowText() {
    if (Math.random() < 0.9) return "Right now, I’m ";
    if (Math.random() < 0.3) return "At this very moment, I am ";
    return "Currently ";
  }

  // As you can see, this is not accurate at all. It’s just an emulation.
  function getStatus(hour, dayOfWeek) {
    if (1 <= dayOfWeek && dayOfWeek <= 5 && 9 <= hour && hour < 17) {
      if (hour === 12) return { emoji: "🥪", text: getEatingText() };
      return { emoji: "🧑🏾‍💻", text: getWorkingText() };
    }
    if (2 <= hour && hour < 9) {
      return { emoji: "💤", text: getSleepingText() };
    }
    if (hour === 20) {
      return { emoji: "🍛", text: getEatingText() };
    }
    if (21 <= hour || hour < 2) {
      return { emoji: "💻", text: getComputeringText() };
    }
    if (hour === 15) {
      return { emoji: "🏞", text: getGrassText() };
    }
    return { emoji: "🎲", text: getWhateverText() };
  }

  function getEatingText() {
    if (Math.random() < 0.9) return "eating.";
    if (Math.random() < 0.4) return "ingesting sustenance.";
    if (Math.random() < 0.2) return "consuming food.";
    return "fooding.";
  }

  function getWorkingText() {
    if (Math.random() < 0.7) return "working.";
    const list = [
      "at work, wrangling some code.",
      "at work, hacking some code into shape.",
      "coding at work.",
      "at work, coding.",
      "at work, programming.",
      "at work, debugging bugs.",
      "at work, solving problems.",
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  function getSleepingText() {
    if (Math.random() < 0.8) return "sleeping...";
    if (Math.random() < 0.4) return "slumbering...";
    if (Math.random() < 0.2) return "having a good sleep...";
    return "not awake...";
  }

  function getComputeringText() {
    if (Math.random() < 0.9) return "computering.";
    const list = [
      "surfing the web.",
      "hobbying my hobbies.",
      "playing games.",
      "reading blogs.",
      "coding some personal project.",
      "just computering around.",
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  function getGrassText() {
    if (Math.random() < 0.8) return "touching some grass...";
    if (Math.random() < 0.6) return "taking in some fresh air.";
    return "probably outside.";
  }

  function getWhateverText() {
    if (Math.random() < 0.6) return "doing whatever.";
    if (Math.random() < 0.5) return "doing whatever I want.";
    return "either doing or not doing anything.";
  }
