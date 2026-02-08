import React, { useState, useRef, useEffect } from "react";
import { Heart, RotateCcw, Share2 } from "lucide-react";
import gsap from "gsap";
import html2canvas from "html2canvas";
import Matter from "matter-js";

// --- Configuration ---
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Lexend:wght@400;700;900&display=swap";

const GIFS = {
  asking: "/asking.gif",
  shocked: "/sad.gif",
  success: "/happy.gif",
};

const COLORS = {
  bg: "bg-rose-50",
  card: "bg-white",
  primary: "bg-rose-300",
  primaryHover: "hover:bg-rose-400",
  secondary: "bg-stone-200",
  text: "text-stone-900",
  border: "border-stone-900",
};

// --- Physics Heart Canvas (Matter.js) ---
const HeartsCanvas = () => {
  const boxRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    // 1. Setup Matter.js
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint;

    const engine = Engine.create();
    engineRef.current = engine;

    engine.gravity.y = 1;

    const render = Render.create({
      element: boxRef.current,
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        background: "transparent",
        wireframes: false,
        pixelRatio: window.devicePixelRatio,
      },
    });

    // 2. Boundaries
    const wallOptions = { isStatic: true, render: { visible: false } };
    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight + 50,
      window.innerWidth,
      100,
      wallOptions,
    );
    const leftWall = Bodies.rectangle(
      -50,
      window.innerHeight / 2,
      100,
      window.innerHeight,
      wallOptions,
    );
    const rightWall = Bodies.rectangle(
      window.innerWidth + 50,
      window.innerHeight / 2,
      100,
      window.innerHeight,
      wallOptions,
    );
    Composite.add(engine.world, [ground, leftWall, rightWall]);

    // 3. Create Hearts
    const hearts = [];
    const heartColors = ["#FDA4AF", "#F43F5E", "#ec4899", "#e11d48"];

    for (let i = 0; i < 180; i++) {
      const radius = 20 + Math.random() * 20;
      const x = Math.random() * window.innerWidth;
      const y = -Math.random() * 1000 - 100;

      const chosenColor =
        heartColors[Math.floor(Math.random() * heartColors.length)];

      const body = Bodies.circle(x, y, radius, {
        restitution: 0.2,
        friction: 0.5,
        density: 0.05,
        render: {
          fillStyle: "transparent", // Physics body is invisible
          strokeStyle: "transparent",
        },
        customColor: chosenColor, // Store color for custom render
      });
      hearts.push(body);
    }
    Composite.add(engine.world, hearts);

    // 4. Interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });

    mouseConstraint.mouse.element.removeEventListener(
      "mousewheel",
      mouseConstraint.mouse.mousewheel,
    );
    mouseConstraint.mouse.element.removeEventListener(
      "DOMMouseScroll",
      mouseConstraint.mouse.mousewheel,
    );
    Composite.add(engine.world, mouseConstraint);

    // 5. Custom Heart Rendering
    Matter.Events.on(render, "afterRender", function () {
      const ctx = render.context;

      hearts.forEach((body) => {
        const { x, y } = body.position;
        const angle = body.angle;
        const r = body.circleRadius * 1.1;
        const color = body.customColor;

        ctx.translate(x, y);
        ctx.rotate(angle);

        // --- PERFECT HEART PATH ---
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.35);
        ctx.bezierCurveTo(-r, -r * 0.9, -r * 1.2, r * 0.4, 0, r * 1.3);
        ctx.bezierCurveTo(r * 1.2, r * 0.4, r, -r * 0.9, 0, -r * 0.35);
        ctx.fillStyle = color;
        ctx.fill();
        // ------------------------------

        ctx.rotate(-angle);
        ctx.translate(-x, -y);
      });
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      Matter.Body.setPosition(ground, {
        x: window.innerWidth / 2,
        y: window.innerHeight + 50,
      });
      Matter.Body.setPosition(rightWall, {
        x: window.innerWidth + 50,
        y: window.innerHeight / 2,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, []);

  return (
    <div ref={boxRef} className="fixed inset-0 pointer-events-auto z-50">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [status, setStatus] = useState("asking");
  const [showHearts, setShowHearts] = useState(false);
  const noBtnRef = useRef(null);
  const captureRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = FONTS_URL;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const moveNoButton = () => {
    setStatus("shocked");
    const currentX = gsap.getProperty(noBtnRef.current, "x") || 0;
    const currentY = gsap.getProperty(noBtnRef.current, "y") || 0;
    const minMove = 100;
    const maxBound = 150;

    const getNewCoordinate = (currentPos) => {
      let newPos;
      let attempts = 0;
      do {
        newPos = Math.random() * maxBound * 2 - maxBound;
        attempts++;
      } while (Math.abs(newPos - currentPos) < minMove && attempts < 10);
      return newPos;
    };

    const newX = getNewCoordinate(currentX);
    const newY = getNewCoordinate(currentY);

    gsap.to(noBtnRef.current, {
      x: newX,
      y: newY,
      duration: 0.5,
      ease: "back.out(1.7)",
      overwrite: true,
    });
  };

  const handleYes = () => {
    setStatus("success");
    setShowHearts(true);
    gsap.set(noBtnRef.current, { clearProps: "all" });
  };

  const handleReload = () => {
    setStatus("asking");
    setShowHearts(false);
    gsap.set(noBtnRef.current, { clearProps: "all" });
  };

const handleShare = async () => {
    if (!captureRef.current) return;
    try {
      // Create the image
      const canvas = await html2canvas(captureRef.current, { 
        scale: 2, 
        backgroundColor: null,
        useCORS: true 
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "our-valentine-moment.png", { type: "image/png" });
        const shareData = {
          files: [file],
        };

        // Try Native Share (Works on Mobile for WhatsApp)
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback for Desktop (Download)
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = "our-valentine-moment.png";
          link.click();
          alert("Image saved! Open WhatsApp and send it to him! 💖");
        }
      });
    } catch (err) {
      console.error("Sharing failed:", err);
      alert("Oops! Sharing failed. Try taking a screenshot manually!");
    }
  };

  const neoClass = `border-2 ${COLORS.border} shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`;

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center ${COLORS.bg} font-['Lexend'] p-4 overflow-hidden relative`}
    >
      {showHearts && <HeartsCanvas />}

      <div className="absolute top-10 left-10 w-16 h-16 bg-pink-200 rounded-full border-2 border-black opacity-50 blur-sm animate-pulse" />
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-rose-200 rounded-full border-2 border-black opacity-50 blur-sm animate-bounce" />

      <div
        ref={captureRef}
        // FIX IS HERE: Conditional z-index. z-10 normally, z-60 (above hearts) when success.
        className={`relative ${status === "success" ? "z-[60]" : "z-10"} w-full max-w-md ${COLORS.card} border-4 ${COLORS.border} shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] rounded-xl p-6 sm:p-8 flex flex-col items-center text-center gap-6`}
      >
        <div
          className={`w-48 h-48 ${COLORS.secondary} border-2 ${COLORS.border} rounded-lg overflow-hidden flex items-center justify-center relative bg-white`}
        >
          <img
            src={GIFS[status]}
            alt="reaction"
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            {status === "success" ? "YAYYYYYY!" : "Will you be my Valentine?"}
          </h1>
          <p className="text-stone-500 font-medium">
            {status === "success"
              ? "Best decision ever! 💖 Prepare for snacks."
              : status === "shocked"
                ? "Oh...okay"
                : "I promise I'm really cool."}
          </p>
        </div>

        {status === "success" ? (
          <div className="flex gap-4 w-full mt-4 justify-center">
            <button
              onClick={handleReload}
              className={`w-auto px-8 flex items-center justify-center py-3 bg-yellow-200 rounded-lg ${neoClass}`}
            >
              <RotateCcw size={24} className="text-stone-900" />
            </button>
            <button
              onClick={handleShare}
              className={`w-auto px-8 flex items-center justify-center py-3 ${COLORS.primary} rounded-lg ${neoClass}`}
            >
              <Share2 size={24} className="text-stone-900" />
            </button>
          </div>
        ) : (
          <div className="flex flex-row gap-2 w-full mt-4 relative h-14">
            <button
              onClick={handleYes}
              className={`flex-1 ${COLORS.primary} ${COLORS.primaryHover} rounded-lg font-bold text-xl flex items-center justify-center gap-2 ${neoClass} z-10`}
            >
              <Heart className="fill-stone-900" size={24} /> YES
            </button>

            <div className="flex-1 relative">
              <button
                ref={noBtnRef}
                onMouseEnter={moveNoButton}
                onTouchStart={moveNoButton}
                onClick={moveNoButton}
                // Added !transition-none to stop CSS from fighting GSAP
                className={`absolute top-0 left-0 w-full h-full bg-yellow-200 rounded-lg font-bold text-xl text-black flex items-center justify-center ${neoClass} !transition-none cursor-not-allowed`}
              >
                No
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 text-stone-400 text-xs font-bold tracking-widest uppercase opacity-60">
        Made with ❤️ for you
      </div>
    </div>
  );
};

export default App;
