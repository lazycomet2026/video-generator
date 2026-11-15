let selectedImage = null;
        let selectedEffects = [];
        let videoBlob = null;
        
        const fileInput = document.getElementById('fileInput');
        const previewImg = document.getElementById('previewImg');
        const genBtn = document.getElementById('genBtn');
        const durationInput = document.getElementById('duration');
        const durationValue = document.getElementById('durationValue');
        const downloadBtn = document.getElementById('downloadBtn');
        
        durationInput.addEventListener('input', function() {
            durationValue.textContent = this.value;
        });
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedImage = event.target.result;
                    previewImg.src = selectedImage;
                    previewImg.style.display = 'block';
                    genBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            }
        });
        
        document.querySelectorAll('.effect-item').forEach(item => {
            item.addEventListener('click', function() {
                this.classList.toggle('selected');
                const effect = this.dataset.effect;
                if (this.classList.contains('selected')) {
                    if (!selectedEffects.includes(effect)) selectedEffects.push(effect);
                } else {
                    selectedEffects = selectedEffects.filter(e => e !== effect);
                }
            });
        });
        
        genBtn.addEventListener('click', function() {
            if (!selectedImage || selectedEffects.length === 0) {
                alert('请选择图片和特效！');
                return;
            }
            
            document.getElementById('previewBox').style.display = 'block';
            genBtn.disabled = true;
            downloadBtn.style.display = 'none';
            
            const canvas = document.getElementById('previewCanvas');
            const ctx = canvas.getContext('2d');
            
            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 8000000
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = function(e) {
                if (e.data.size > 0) chunks.push(e.data);
            };
            
            mediaRecorder.onstop = function() {
                videoBlob = new Blob(chunks, { type: 'video/webm' });
                downloadBtn.style.display = 'block';
                downloadBtn.onclick = function() {
                    const url = URL.createObjectURL(videoBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'video_' + Date.now() + '.webm';
                    a.click();
                    URL.revokeObjectURL(url);
                };
            };
            
            mediaRecorder.start();
            
            const img = new Image();
            img.src = selectedImage;
            img.onload = function() {
                const imgRatio = img.width / img.height;
                const maxCanvasWidth = 1280;
                const maxCanvasHeight = 720;
                
                let canvasWidth, canvasHeight;
                if (imgRatio > maxCanvasWidth / maxCanvasHeight) {
                    canvasWidth = maxCanvasWidth;
                    canvasHeight = Math.min(maxCanvasHeight, maxCanvasWidth / imgRatio);
                } else {
                    canvasHeight = maxCanvasHeight;
                    canvasWidth = Math.min(maxCanvasWidth, maxCanvasHeight * imgRatio);
                }
                
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                
                const duration = parseInt(durationInput.value);
                const fps = 30;
                const totalFrames = duration * fps;
                let frame = 0;
                
                // 预生成粒子数据
                const particles = [];
                for (let i = 0; i < 50; i++) {
                    particles.push({
                        x: Math.random() * canvasWidth,
                        y: Math.random() * canvasHeight,
                        size: 3 + Math.random() * 5,
                        speed: 1 + Math.random() * 2,
                        opacity: 0.3 + Math.random() * 0.7
                    });
                }
                
                // 预生成网格偏移
                const gridOffset = [];
                for (let i = 0; i < 30; i++) {
                    gridOffset.push(Math.random() * 100);
                }
                
                function render() {
                    if (frame >= totalFrames) {
                        mediaRecorder.stop();
                        genBtn.disabled = false;
                        document.getElementById('status').textContent = '✅ 生成完成！点击下载';
                        return;
                    }
                    
                    const time = frame / fps;
                    
                    // 背景渐变动画
                    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
                    gradient.addColorStop(0, `hsl(${200 + Math.sin(time * 0.5) * 20}, 50%, ${5 + Math.sin(time * 0.3) * 3}%)`);
                    gradient.addColorStop(1, `hsl(${220 + Math.cos(time * 0.5) * 20}, 50%, ${8 + Math.cos(time * 0.3) * 3}%)`);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                    
                    // 绘制图片（带轻微缩放动画）
                    const baseScale = 0.85;
                    const zoom = baseScale + Math.sin(time * 0.8) * 0.02;
                    const scale = Math.max(canvasWidth / img.width, canvasHeight / img.height) * zoom;
                    const w = img.width * scale;
                    const h = img.height * scale;
                    ctx.drawImage(img, (canvasWidth - w) / 2, (canvasHeight - h) / 2, w, h);
                    
                    // 水波纹效果（更强）
                    if (selectedEffects.includes('ripple')) {
                        const numRipples = 6;
                        for (let i = 0; i < numRipples; i++) {
                            const rippleTime = (time * 0.8 + i * 0.4) % 3;
                            if (rippleTime < 3) {
                                const radius = rippleTime * 250;
                                const alpha = 0.6 * (1 - rippleTime / 3);
                                ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
                                ctx.lineWidth = 3;
                                ctx.beginPath();
                                ctx.arc(canvasWidth/2, canvasHeight/2, radius, 0, Math.PI * 2);
                                ctx.stroke();
                            }
                        }
                    }
                    
                    // 粒子效果（更大更明显）
                    if (selectedEffects.includes('particle')) {
                        particles.forEach((p, i) => {
                            const y = (p.y - time * p.speed * 50) % (canvasHeight + 50);
                            const x = p.x + Math.sin(time * 2 + i) * 20;
                            const pulse = 1 + Math.sin(time * 3 + i) * 0.3;
                            ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity * pulse})`;
                            ctx.beginPath();
                            ctx.arc(x, y, p.size * pulse, 0, Math.PI * 2);
                            ctx.fill();
                        });
                    }
                    
                    // 网格背景（动态）
                    if (selectedEffects.includes('grid')) {
                        ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
                        ctx.lineWidth = 1;
                        const gridSize = 50;
                        const offset = (time * 30) % gridSize;
                        for (let x = 0; x < canvasWidth; x += gridSize) {
                            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasHeight); ctx.stroke();
                        }
                        for (let y = offset; y < canvasHeight; y += gridSize) {
                            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasWidth, y); ctx.stroke();
                        }
                    }
                    
                    // 爆炸效果
                    if (selectedEffects.includes('explosion') && frame % 60 === 0) {
                        const ex = Math.random() * canvasWidth;
                        const ey = Math.random() * canvasHeight;
                        const maxRadius = 150;
                        for (let r = 0; r < maxRadius; r += 5) {
                            const alpha = 0.8 * (1 - r / maxRadius);
                            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                            ctx.beginPath();
                            ctx.arc(ex, ey, r, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    
                    // 扫描线
                    if (selectedEffects.includes('scanline')) {
                        const scanY = (time * 200) % canvasHeight;
                        const gradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
                        gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
                        gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.3)');
                        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(0, scanY - 50, canvasWidth, 100);
                    }
                    
                    // 霓虹灯
                    if (selectedEffects.includes('neon')) {
                        for (let i = 0; i < 8; i++) {
                            const y = (time * 100 + i * 100) % (canvasHeight + 200) - 100;
                            const gradient = ctx.createLinearGradient(0, y, canvasWidth, y);
                            gradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
                            gradient.addColorStop(0.5, `rgba(0, 212, 255, ${0.4 + Math.sin(time + i) * 0.2})`);
                            gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, y, canvasWidth, 3);
                        }
                    }
                    
                    const progress = (frame / totalFrames) * 100;
                    document.getElementById('progressFill').style.width = progress + '%';
                    document.getElementById('status').textContent = `生成中... ${Math.round(progress)}%`;
                    
                    frame++;
                    setTimeout(render, 1000 / fps);
                }
                
                render();
            };
        });