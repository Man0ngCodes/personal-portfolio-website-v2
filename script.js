document.addEventListener('DOMContentLoaded', () => {
    // 1. Check the initial system preference on page load
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    
    function setDarkTheme(isDark) {
        if (isDark) {
            console.log("Dark mode is enabled");
            document.body.classList.add("dark-theme");
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            console.log("Light mode is enabled");
            document.body.classList.remove("dark-theme");
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    // Apply the initial system preference
    setDarkTheme(prefersDarkScheme.matches);

    // Listen for changes to the system theme dynamically
    prefersDarkScheme.addEventListener('change', (e) => {
        setDarkTheme(e.matches);
    });

    // Manual toggle by user with Circular View Transition wipe
    const themeToggleBtn = document.getElementById('theme-toggle');
    themeToggleBtn.addEventListener('click', (e) => {
        const isCurrentlyDark = document.body.classList.contains('dark-theme');
        
        // Fallback for browsers that don't support View Transitions
        if (!document.startViewTransition) {
            setDarkTheme(!isCurrentlyDark);
            return;
        }

        const x = e.clientX;
        const y = e.clientY;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
            document.documentElement.classList.add('switching-theme');
            setDarkTheme(!isCurrentlyDark);
        });

        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                    ]
                },
                {
                    duration: 1500, // 1.5 seconds wipe
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        });

        transition.finished.then(() => {
            document.documentElement.classList.remove('switching-theme');
        });
    });

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    revealElements.forEach(el => revealObserver.observe(el));

    // Particle Canvas Animation (Antigravity Inspiration)
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    let mouse = {
        x: null,
        y: null,
        radius: 150
    };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = undefined;
        mouse.y = undefined;
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });

    resizeCanvas();

    class Particle {
        constructor(x, y, dx, dy, size, baseColor) {
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            this.dx = dx;
            this.dy = dy;
            this.size = size;
            this.baseColor = baseColor;
            this.density = (Math.random() * 30) + 1;
        }

        draw() {
            // Check if dark theme is active for dynamic coloring
            const isDark = document.body.classList.contains('dark-theme');
            let color = isDark ? `rgba(167, 139, 250, ${this.size/5})` : `rgba(59, 130, 246, ${this.size/5})`;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = color;
            ctx.fill();
        }

        update() {
            // Floating movement
            this.x += this.dx;
            this.y += this.dy;

            // Bounce off edges smoothly
            if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
            if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;

            // Mouse interaction: follow cursor and push away slightly
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;

                // Max distance, past that the force is 0
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                
                if (distance < mouse.radius) {
                    let pushX = forceDirectionX * force * this.density * 0.5;
                    let pushY = forceDirectionY * force * this.density * 0.5;
                    
                    // Slightly repel from cursor but also get dragged towards it along the edges
                    this.x -= pushX;
                    this.y -= pushY;
                }
            }

            this.draw();
        }
    }

    function initParticles() {
        particles = [];
        let numberOfParticles = (canvas.width * canvas.height) / 10000;
        if(numberOfParticles > 150) numberOfParticles = 150; // Cap particles for performance
        
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 3) + 1;
            let x = Math.random() * (canvas.width - size * 2) + size * 2;
            let y = Math.random() * (canvas.height - size * 2) + size * 2;
            let dx = (Math.random() - 0.5) * 0.5;
            let dy = (Math.random() - 0.5) * 0.5;
            particles.push(new Particle(x, y, dx, dy, size));
        }
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        
        connectParticles();
    }

    function connectParticles() {
        const isDark = document.body.classList.contains('dark-theme');
        let maxDistance = 120;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = dx * dx + dy * dy;

                if (distance < (maxDistance * maxDistance)) {
                    let opacity = 1 - (distance / (maxDistance * maxDistance));
                    ctx.strokeStyle = isDark ? `rgba(167, 139, 250, ${opacity * 0.2})` : `rgba(59, 130, 246, ${opacity * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    initParticles();
    animateParticles();
});
