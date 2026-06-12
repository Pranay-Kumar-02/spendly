import React, { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";

// ── MASTER 3D THEME CONFIGURATION MATRIX ──
const PARTICLE_THEMES = {
    "particle-cosmos": {
        bg: ["#0F0C29", "#302B63", "#24243e"],
        particle: "#A78BFA",
        physics: "network",
        count: 60, speed: 0.3, size: 2.5, connectionDist: 110,
    },
    "particle-ocean": {
        bg: ["#0F2027", "#203A43", "#2C5364"],
        particle: "#38BDF8",
        physics: "network",
        count: 50, speed: 0.25, size: 2, connectionDist: 100,
    },
    "particle-snow": {
        bg: ["#0f172a", "#1e293b", "#0f172a"],
        particle: "#E0F2FE",
        physics: "snow",
        count: 55, speed: 0.8, size: 2.5,
    },
    "particle-galaxy": {
        bg: ["#170524", "#2B0B3F", "#170524"],
        particle: "#FB923C",
        physics: "orbit",
        count: 70, speed: 0.5, size: 2,
    },
    "particle-sakura": {
        bg: ["#2D0B2D", "#1A0A1A", "#2D0B2D"],
        particle: "#FCE7F3",
        physics: "sakura",
        count: 40, speed: 0.6, size: 4,
    },
    "particle-matrix": {
        bg: ["#022c16", "#064e3b", "#022c16"],
        particle: "#34D399",
        physics: "matrix",
        count: 80, speed: 3.5, size: 1.5,
    },
    "particle-fire": {
        bg: ["#2a0800", "#450a0a", "#2a0800"],
        particle: "#FEE2E2",
        physics: "fire",
        count: 65, speed: 1.2, size: 2.5,
    },
    "particle-aurora": {
        bg: ["#0F172A", "#1E1B4B", "#0F172A"],
        particle: "#A5B4FC",
        physics: "network",
        count: 55, speed: 0.2, size: 3, connectionDist: 130,
    },
    "particle-gold": {
        bg: ["#2E1005", "#451A03", "#2E1005"],
        particle: "#FEF08A",
        physics: "twinkle",
        count: 60, speed: 0.4, size: 2.5,
    },
    "particle-neon": {
        bg: ["#020617", "#0F172A", "#020617"],
        particle: "#CCFBF1",
        physics: "neon",
        count: 50, speed: 0.5, size: 2.5, connectionDist: 90,
    }
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : "255,255,255";
};

const ParticleBackground = () => {
    const { currentTheme } = useApp();
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const particlesRef = useRef([]);

    const isParticleTheme = currentTheme?.startsWith("particle-");
    const config = PARTICLE_THEMES[currentTheme];

    useEffect(() => {
        if (!isParticleTheme || !config) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // High DPI Display Fix for perfect crispness
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
        };
        resize();
        window.addEventListener("resize", resize);

        // Adjust particle count for mobile to keep it 60fps smooth
        const isMobile = window.innerWidth < 768;
        const finalCount = isMobile ? Math.floor(config.count * 0.6) : config.count;

        // Init particles based on physics profile
        particlesRef.current = Array.from({ length: finalCount }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * config.speed,
            vy: config.physics === "fire" ? -(Math.random() * config.speed + 0.5) : (Math.random() - 0.5) * config.speed,
            size: Math.random() * config.size + 1,
            opacity: Math.random() * 0.7 + 0.3,
            pulse: Math.random() * Math.PI * 2,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 2,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitRadius: Math.random() * (window.innerWidth / 2),
        }));

        const particleRgb = hexToRgb(config.particle);

        // Advanced Rendering Shapes
        const drawSakuraPetal = (x, y, size, rotation, opacity) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.bezierCurveTo(size * 0.5, -size * 0.5, size * 0.8, size * 0.3, 0, size);
            ctx.bezierCurveTo(-size * 0.8, size * 0.3, -size * 0.5, -size * 0.5, 0, -size);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
            gradient.addColorStop(0, `rgba(${particleRgb},1)`);
            gradient.addColorStop(1, `rgba(${particleRgb},0.2)`);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
        };

        const drawSnowflake = (x, y, size, rotation, opacity) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.globalAlpha = opacity;
            ctx.strokeStyle = `rgba(${particleRgb},${opacity})`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 6; i++) {
                ctx.rotate(Math.PI / 3);
                ctx.beginPath();
                ctx.moveTo(0, 0); ctx.lineTo(0, size);
                ctx.moveTo(0, size * 0.4); ctx.lineTo(size * 0.3, size * 0.7);
                ctx.moveTo(0, size * 0.4); ctx.lineTo(-size * 0.3, size * 0.7);
                ctx.stroke();
            }
            ctx.restore();
        };

        const draw = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            const particles = particlesRef.current;

            // 1. Networking (Constellations)
            if (config.physics === "network" || config.physics === "neon") {
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < config.connectionDist) {
                            const alpha = (1 - dist / config.connectionDist) * (config.physics === "neon" ? 0.6 : 0.25);
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(${particleRgb},${alpha})`;
                            ctx.lineWidth = 0.8;
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                }
            }

            // 2. Physics & Shapes Engine
            particles.forEach(p => {
                p.pulse += 0.03;
                p.rotation += p.rotSpeed;

                // Mathematical Movement Profiles
                if (config.physics === "matrix") {
                    p.y += config.speed + (p.size * 0.5);
                    p.x += Math.sin(p.pulse) * 0.2; // Digital waver
                    if (p.y > window.innerHeight + 10) { p.y = -10; p.x = Math.random() * window.innerWidth; }
                }
                else if (config.physics === "snow" || config.physics === "sakura") {
                    p.y += config.speed + (p.size * 0.2); // Fall down
                    p.x += Math.sin(p.pulse) * 1.5; // Sway side to side
                    if (p.y > window.innerHeight + 20) { p.y = -20; p.x = Math.random() * window.innerWidth; }
                }
                else if (config.physics === "fire") {
                    p.y += p.vy; // Rise up
                    p.x += Math.sin(p.pulse) * 0.8; // Flicker
                    if (p.y < -20) { p.y = window.innerHeight + 20; p.x = Math.random() * window.innerWidth; }
                }
                else if (config.physics === "orbit") {
                    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
                    p.orbitAngle += (0.002 * config.speed) / (p.size * 0.5);
                    p.x = cx + Math.cos(p.orbitAngle) * p.orbitRadius;
                    p.y = cy + Math.sin(p.orbitAngle) * p.orbitRadius * 0.8; // Elliptical 
                }
                else {
                    // Standard floating drift
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < -20) p.x = window.innerWidth + 20;
                    if (p.x > window.innerWidth + 20) p.x = -20;
                    if (p.y < -20) p.y = window.innerHeight + 20;
                    if (p.y > window.innerHeight + 20) p.y = -20;
                }

                // Opacity Profiles
                let currentOpacity = p.opacity * (0.6 + Math.sin(p.pulse) * 0.4); // Breathing
                if (config.physics === "twinkle" || config.physics === "neon") currentOpacity = 0.2 + Math.abs(Math.sin(p.pulse * 2)) * 0.8; // Sharp blink
                if (config.physics === "fire") currentOpacity *= Math.max(0, p.y / window.innerHeight); // Fade out as it rises

                // Renderer
                if (config.physics === "sakura") {
                    drawSakuraPetal(p.x, p.y, p.size * 3, p.rotation, currentOpacity);
                } else if (config.physics === "snow") {
                    drawSnowflake(p.x, p.y, p.size * 2, p.rotation, currentOpacity);
                } else if (config.physics === "matrix") {
                    // Matrix trails
                    ctx.fillStyle = `rgba(${particleRgb},${currentOpacity})`;
                    ctx.fillRect(p.x, p.y, p.size, p.size * 6);
                } else {
                    // Standard Glowing Orbs
                    const rad = p.size * 3;
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
                    gradient.addColorStop(0, `rgba(${particleRgb},${currentOpacity})`);
                    gradient.addColorStop(0.4, `rgba(${particleRgb},${currentOpacity * 0.5})`);
                    gradient.addColorStop(1, `rgba(${particleRgb},0)`);

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // Core bright dot
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${particleRgb},${currentOpacity * 1.5})`;
                    ctx.fill();
                }
            });

            animRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
            window.removeEventListener("resize", resize);
        };
    }, [currentTheme, isParticleTheme, config]);

    if (!isParticleTheme || !config) return null;

    const bgGradient = config.bg.length === 3
        ? `linear-gradient(135deg, ${config.bg[0]} 0%, ${config.bg[1]} 50%, ${config.bg[2]} 100%)`
        : `linear-gradient(135deg, ${config.bg[0]}, ${config.bg[1]})`;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: -1, background: bgGradient, pointerEvents: "none" }}>
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        </div>
    );
};

export default ParticleBackground;