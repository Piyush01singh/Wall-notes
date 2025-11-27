import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { User as UserIcon, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface AuthProps {
  mode: 'login' | 'signup';
  onSwitchMode: () => void;
  onSubmit: (data: any) => void;
  error?: string | null;
}

// Advanced Physics Ball
class Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    mass: number;
    isDragging: boolean;

    constructor(w: number, h: number) {
        this.radius = Math.random() * 30 + 20; // Larger, cleaner balls
        this.mass = this.radius;
        this.x = Math.random() * (w - this.radius * 2) + this.radius;
        this.y = Math.random() * (h - this.radius * 2) + this.radius;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        
        const colors = [
            '#1e293b', '#334155', '#475569', '#94a3b8', '#0ea5e9', '#6366f1'
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.isDragging = false;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    update(w: number, h: number, mouseX: number, mouseY: number) {
        if (this.isDragging) return;

        // 1. Perpetual Motion (Wander Force)
        // Add tiny random changes to velocity to keep them moving alive
        this.vx += (Math.random() - 0.5) * 0.05;
        this.vy += (Math.random() - 0.5) * 0.05;

        // Limit max speed to keep it chill
        const maxSpeed = 3;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        // 2. Mouse Repulsion
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulsionRadius = 200;

        if (dist < repulsionRadius) {
            const force = (repulsionRadius - dist) / repulsionRadius; // 0 to 1
            const repulsionStrength = 0.5;
            this.vx += (dx / dist) * force * repulsionStrength;
            this.vy += (dy / dist) * force * repulsionStrength;
        }

        // 3. Move
        this.x += this.vx;
        this.y += this.vy;

        // 4. Wall Collisions (Bounce)
        const bounce = 0.9; 
        
        if (this.x + this.radius > w) {
            this.x = w - this.radius;
            this.vx *= -bounce;
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -bounce;
        }

        if (this.y + this.radius > h) {
            this.y = h - this.radius;
            this.vy *= -bounce;
        } else if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy *= -bounce;
        }
    }
}

const resolveCollision = (b1: Ball, b2: Ball) => {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < b1.radius + b2.radius) {
        const overlap = (b1.radius + b2.radius - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;

        b1.x -= nx * overlap;
        b1.y -= ny * overlap;
        b2.x += nx * overlap;
        b2.y += ny * overlap;

        const dvx = b2.vx - b1.vx;
        const dvy = b2.vy - b1.vy;
        const velAlongNormal = dvx * nx + dvy * ny;

        if (velAlongNormal > 0) return;

        const restitution = 0.9; // Bouncy
        const j = -(1 + restitution) * velAlongNormal;
        const impulse = j / (1/b1.mass + 1/b2.mass);

        b1.vx -= (impulse * nx) / b1.mass;
        b1.vy -= (impulse * ny) / b1.mass;
        b2.vx += (impulse * nx) / b2.mass;
        b2.vy += (impulse * ny) / b2.mass;
    }
};

export const Auth: React.FC<AuthProps> = ({ mode, onSwitchMode, onSubmit, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, isDown: false, draggingBall: null as Ball | null, lastX: 0, lastY: 0 });
  const ballsRef = useRef<Ball[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (ballsRef.current.length === 0) {
            ballsRef.current = Array.from({ length: 12 }, () => new Ball(canvas.width, canvas.height));
        }
    };

    const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const balls = ballsRef.current;

        for (let i = 0; i < balls.length; i++) {
            // Update with mouse repulsion
            balls[i].update(canvas.width, canvas.height, mouseRef.current.x, mouseRef.current.y);
            
            for (let j = i + 1; j < balls.length; j++) {
                resolveCollision(balls[i], balls[j]);
            }
        }

        // Drag Logic
        if (mouseRef.current.draggingBall) {
            const ball = mouseRef.current.draggingBall;
            const dx = mouseRef.current.x - mouseRef.current.lastX;
            const dy = mouseRef.current.y - mouseRef.current.lastY;
            
            ball.x = mouseRef.current.x;
            ball.y = mouseRef.current.y;
            // Throwing velocity
            ball.vx = dx * 1.5; 
            ball.vy = dy * 1.5;
        }

        balls.forEach(ball => ball.draw(ctx));

        mouseRef.current.lastX = mouseRef.current.x;
        mouseRef.current.lastY = mouseRef.current.y;

        animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        mouseRef.current.isDown = true;
        mouseRef.current.x = mx;
        mouseRef.current.y = my;

        for (const ball of ballsRef.current) {
            const dist = Math.hypot(mx - ball.x, my - ball.y);
            if (dist < ball.radius) {
                mouseRef.current.draggingBall = ball;
                ball.isDragging = true;
                break; 
            }
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.clientX - rect.left;
        mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseUp = () => {
        if (mouseRef.current.draggingBall) {
            mouseRef.current.draggingBall.isDragging = false;
            mouseRef.current.draggingBall = null;
        }
        mouseRef.current.isDown = false;
        // Move repulsive force away when not interacting
        if (!mouseRef.current.isDown) {
           // mouseRef.current.x = -1000;
           // mouseRef.current.y = -1000;
        }
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    resize();
    render();

    return () => {
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const MotionDiv = motion.div as any;

  return (
    <div className="min-h-screen flex items-center justify-center bg-nebula-50 dark:bg-nebula-950 relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 cursor-auto" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/40 dark:via-nebula-950/20 dark:to-nebula-950/60 pointer-events-none z-0" />

      <MotionDiv 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10 relative px-4"
      >
        <div className="bg-white/70 dark:bg-nebula-900/70 backdrop-blur-2xl border border-white/50 dark:border-nebula-700/50 p-8 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.3)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-nebula-900 dark:bg-white text-white dark:text-nebula-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <span className="font-mono font-bold text-2xl tracking-tighter">WN</span>
            </div>
            <h1 className="text-3xl font-bold text-nebula-900 dark:text-white mb-2 tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Join Wall Notes'}
            </h1>
            <p className="text-nebula-500 dark:text-nebula-400">
              {mode === 'login' ? 'Enter your credentials to access your wall' : 'Build your digital knowledge wall'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-nebula-400 group-focus-within:text-nebula-900 dark:group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="text"
                  placeholder="Full Name"
                  required={mode === 'signup'}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-nebula-50/50 dark:bg-nebula-800/50 border border-nebula-200 dark:border-nebula-700 rounded-xl py-3.5 pl-11 pr-4 text-nebula-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nebula-900 dark:focus:ring-white/50 transition-all placeholder:text-nebula-400"
                />
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-nebula-400 group-focus-within:text-nebula-900 dark:group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-nebula-50/50 dark:bg-nebula-800/50 border border-nebula-200 dark:border-nebula-700 rounded-xl py-3.5 pl-11 pr-4 text-nebula-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nebula-900 dark:focus:ring-white/50 transition-all placeholder:text-nebula-400"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-nebula-400 group-focus-within:text-nebula-900 dark:group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-nebula-50/50 dark:bg-nebula-800/50 border border-nebula-200 dark:border-nebula-700 rounded-xl py-3.5 pl-11 pr-4 text-nebula-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-nebula-900 dark:focus:ring-white/50 transition-all placeholder:text-nebula-400"
              />
            </div>

            {error && (
              <MotionDiv 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30"
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </MotionDiv>
            )}

            <Button 
              type="submit"
              className="w-full py-4 text-lg font-semibold shadow-xl shadow-nebula-900/10 hover:shadow-nebula-900/20 transition-all"
              icon={<ArrowRight size={20} />}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-nebula-500">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={onSwitchMode}
              className="font-semibold text-nebula-900 dark:text-white hover:underline focus:outline-none"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};