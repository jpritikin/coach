type SliderMode = 'horizontal' | 'vertical';

let sliderIdCounter = 0;

class BookSlider {
    private id: string;
    private isDragging = false;
    private mode: SliderMode;
    private clipBase: boolean;
    private holdTimer: number | null = null;

    private get container(): HTMLElement {
        return document.querySelector(`[data-slider-id="${this.id}"]`) as HTMLElement;
    }
    private get bar(): HTMLElement {
        return this.container.querySelector('.book-slider-bar') as HTMLElement;
    }
    private get barSvg(): SVGElement {
        return this.bar.querySelector('svg') as SVGElement;
    }
    private get baseImg(): HTMLImageElement {
        return this.container.querySelector('.book-slider-base') as HTMLImageElement;
    }
    private get overlayImg(): HTMLImageElement {
        return this.container.querySelector('.book-slider-overlay-img') as HTMLImageElement;
    }

    constructor(container: HTMLElement) {
        this.id = String(sliderIdCounter++);
        container.setAttribute('data-slider-id', this.id);

        this.mode = Math.random() < 0.1 ? 'vertical' : 'horizontal';
        this.clipBase = Math.random() < 0.25;

        this.applyModeStyles();
    }

    private applyModeStyles(): void {
        const cursor = this.mode === 'horizontal' ? 'ew-resize' : 'ns-resize';
        this.container.style.cursor = cursor;
        this.bar.style.cursor = cursor;

        if (this.mode === 'horizontal') {
            this.bar.style.left = '50%';
            this.bar.style.top = '0';
            this.bar.style.transform = 'translateX(-50%)';
            this.bar.style.width = '4px';
            this.bar.style.height = '100%';
            this.overlayImg.style.clipPath = this.clipBase ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)';
            this.barSvg.style.transform = 'rotate(0deg)';
        } else {
            this.bar.style.top = '50%';
            this.bar.style.left = '0';
            this.bar.style.transform = 'translateY(-50%)';
            this.bar.style.width = '100%';
            this.bar.style.height = '4px';
            this.overlayImg.style.clipPath = this.clipBase ? 'inset(50% 0 0 0)' : 'inset(0 0 50% 0)';
            this.barSvg.style.transform = 'rotate(90deg)';
        }
    }

    setMode(mode: SliderMode): void {
        this.mode = mode;
        this.applyModeStyles();
    }

    setClipBase(clipBase: boolean): void {
        this.clipBase = clipBase;
        this.applyModeStyles();
    }

    getState(): { mode: SliderMode; clipBase: boolean } {
        return { mode: this.mode, clipBase: this.clipBase };
    }

    private switchMode(): void {
        this.mode = this.mode === 'horizontal' ? 'vertical' : 'horizontal';
        this.applyModeStyles();
    }

    startDragging(): void {
        this.isDragging = true;
        this.container.style.cursor = this.mode === 'horizontal' ? 'ew-resize' : 'ns-resize';

        this.holdTimer = window.setTimeout(() => {
            if (this.isDragging && Math.random() < 0.2) this.switchMode();
        }, 5000);
    }

    stopDragging(): void {
        this.isDragging = false;
        if (this.holdTimer !== null) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
    }

    handleMove(clientX: number, clientY: number): void {
        if (!this.isDragging) return;

        const rect = this.container.getBoundingClientRect();

        if (this.mode === 'horizontal') {
            let pos = ((clientX - rect.left) / rect.width) * 100;
            pos = Math.max(0, Math.min(100, pos));
            this.overlayImg.style.clipPath = this.clipBase
                ? `inset(0 0 0 ${pos}%)`
                : `inset(0 ${100 - pos}% 0 0)`;
            this.bar.style.left = `${pos}%`;
        } else {
            let pos = ((clientY - rect.top) / rect.height) * 100;
            pos = Math.max(0, Math.min(100, pos));
            this.overlayImg.style.clipPath = this.clipBase
                ? `inset(${pos}% 0 0 0)`
                : `inset(0 0 ${100 - pos}% 0)`;
            this.bar.style.top = `${pos}%`;
        }
    }

    handleClick(clientX: number, clientY: number, target: EventTarget | null): void {
        if ((target as Element)?.closest('.book-slider-bar')) return;
        this.handleMove(clientX, clientY);
    }

    isBar(el: Element): boolean {
        const bar = el.closest('.book-slider-bar');
        return !!bar && bar.closest(`[data-slider-id="${this.id}"]`) !== null;
    }

    owns(el: Element): boolean {
        return el.closest(`[data-slider-id="${this.id}"]`) !== null;
    }
}

// All event listeners on document — survives DOM re-renders
let draggingSlider: BookSlider | null = null;
const sliders: BookSlider[] = [];

document.querySelectorAll<HTMLElement>('.book-slider-container').forEach(el => {
    sliders.push(new BookSlider(el));
});

document.addEventListener('mousedown', (e) => {
    const target = e.target as Element;
    const slider = sliders.find(s => s.isBar(target));
    if (slider) { draggingSlider = slider; slider.startDragging(); e.preventDefault(); }
});
document.addEventListener('mouseup', () => { draggingSlider?.stopDragging(); draggingSlider = null; });
document.addEventListener('mousemove', (e) => { draggingSlider?.handleMove(e.clientX, e.clientY); });

document.addEventListener('touchstart', (e) => {
    const target = e.target as Element;
    const slider = sliders.find(s => s.isBar(target));
    if (slider) { draggingSlider = slider; slider.startDragging(); e.preventDefault(); }
}, { passive: false });
document.addEventListener('touchend', () => { draggingSlider?.stopDragging(); draggingSlider = null; });
document.addEventListener('touchmove', (e) => {
    if (draggingSlider) { e.preventDefault(); draggingSlider.handleMove(e.touches[0].clientX, e.touches[0].clientY); }
}, { passive: false });

document.addEventListener('click', (e) => {
    if (draggingSlider) return;
    const target = e.target as Element;
    const slider = sliders.find(s => s.owns(target));
    slider?.handleClick(e.clientX, e.clientY, target);
});

if (new URLSearchParams(window.location.search).has('debug')) {
    const panel = document.createElement('div');
    panel.style.cssText = 'position:fixed;bottom:1rem;right:1rem;background:#1e1e1e;color:#eee;padding:0.75rem 1rem;border-radius:0.5rem;font:13px monospace;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
    panel.innerHTML = `
        <div style="font-weight:bold;margin-bottom:0.25rem;">book-slider debug</div>
        <label style="display:flex;gap:0.5rem;align-items:center;">
            <span style="width:80px">mode</span>
            <select id="bs-mode" style="background:#333;color:#eee;border:1px solid #555;padding:2px 4px;border-radius:3px;">
                <option value="horizontal">horizontal</option>
                <option value="vertical">vertical</option>
            </select>
        </label>
        <label style="display:flex;gap:0.5rem;align-items:center;">
            <span style="width:80px">clipBase</span>
            <select id="bs-clipbase" style="background:#333;color:#eee;border:1px solid #555;padding:2px 4px;border-radius:3px;">
                <option value="false">false</option>
                <option value="true">true</option>
            </select>
        </label>
    `;
    document.body.appendChild(panel);

    const modeSelect = panel.querySelector<HTMLSelectElement>('#bs-mode')!;
    const clipBaseSelect = panel.querySelector<HTMLSelectElement>('#bs-clipbase')!;

    const updatePanel = () => {
        const state = sliders[0]?.getState();
        if (!state) return;
        modeSelect.value = state.mode;
        clipBaseSelect.value = String(state.clipBase);
    };

    modeSelect.addEventListener('change', () => {
        sliders[0]?.setMode(modeSelect.value as SliderMode);
    });
    clipBaseSelect.addEventListener('change', () => {
        sliders[0]?.setClipBase(clipBaseSelect.value === 'true');
    });

    updatePanel();
}
