# 前端 WebGL 高级等高线渲染指南 (Generative Topographic Rendering)

这是一份关于如何在前端利用 Three.js 与自定义 GLSL 着色器（Shader）渲染出极具专业设计感、高性能且极其逼真的生成式等高线背景的实战指南。

通过以下核心技术，你可以摒弃死板的图片或耗性能的 Canvas 2D，用最底层的数学构建出极具艺术感的动态地理纹理。

---

## 核心原理概述

真实世界中等高线的本质是：**地形高度（Elevation）在特定间隔下的集合**。
映射到图形学中，我们需要分为两步：
1. **造山**：使用噪声函数（Noise）生成地形的高度图。
2. **切片**：使用数学函数提取高度图的切面，并将其绘制为等高线。

---

## 第一步：造山 (Procedural Terrain Generation)

单纯的随机噪声（如单纯的 Simplex Noise）看起来像无规律的斑块，完全不具备地质学特征。为了生成逼真的地貌，我们需要使用分形和扭曲技术。

### 1. 分形布朗运动 (FBM, Fractal Brownian Motion)
通过叠加多个频率成倍增加、振幅成倍减小的噪声，我们可以模拟自然界中“大山脉包含小山丘，小山丘上包含碎石”的碎形特征。

```glsl
float noiseVal = 0.0;
float amplitude = 0.5;
float frequency = 1.0;

for (int i = 0; i < 4; i++) {
    // 将噪声映射到 [0, 1] 区间
    float n = snoise(vec3(pos * frequency, 0.0)) * 0.5 + 0.5;
    noiseVal += amplitude * n;
    frequency *= 2.0;
    amplitude *= 0.4; // 控制高频细节的强度，越小越平滑
}
```

### 2. 空间扭曲 (Domain Warping)
真实的地理环境是由地壳运动和水流冲刷形成的，具有强烈的方向性和流动感。我们在获取噪声前，先用另一组低频噪声对坐标进行扭曲。

```glsl
// 用低频噪声生成流动的偏移量
float warpX = snoise(vec3(pos * 0.8, 0.0));
float warpY = snoise(vec3(pos * 0.8 + 100.0, 0.0));

// 对原始坐标施加空间扭曲
vec2 warpedPos = pos + vec2(warpX, warpY) * 0.25; 
```

### 3. 地形雕刻 (Terrain Exponentiation)
真实地图中，平原占地面积广，而山峰非常陡峭。我们可以用指数函数对高度进行非线性重映射，强制压平山谷。

```glsl
// noiseVal 越小，受指数影响后越接近 0 (平原)；值越接近 1，变化越剧烈 (陡坡)
noiseVal = pow(noiseVal, 1.5); 
```

---

## 第二步：切片与等高线提取

得到范围在 `[0.0, 1.0]` 的逼真高度图 `noiseVal` 后，我们如何画线？

### 1. 基础数学推导
设定我们要画 45 条等高线：
```glsl
float linesCount = 45.0; 
float f = noiseVal * linesCount; 
```
此时 `f` 的范围是 `0` 到 `45`。每一条等高线，就是 `f` 等于整数（如 1.0, 2.0, 3.0）的位置。
通过取小数部分 `fract(f)`，我们可以得到当前像素距离最近的等高线的距离。

```glsl
float contour = fract(f);
// 让 0 和 1 的边界重合，算出到最近整数的绝对距离（0.0 到 0.5）
float distToLine = min(contour, 1.0 - contour); 
```

### 2. 完美的均匀线宽与抗锯齿 (fwidth)
> [!IMPORTANT]  
> 核心难点：如果你直接用 `distToLine < 0.05` 画线，平缓地区的线条会极粗，陡坡地区的线条会细到看不见。等高线的屏幕宽度不应随坡度变化！

解决方案是使用 WebGL 的标准导数 `fwidth()`。它可以计算出某个值在屏幕上相邻像素间的变化率。
通过 `df = fwidth(f)`，我们就能以**屏幕物理像素**为单位来定义线宽，做到全屏幕线宽绝对一致。

```glsl
float df = fwidth(f);

float lineThickness = 0.2 * df; // 线条的核心实体厚度
float edgeSoftness = 1.5 * df;  // 1.5 个像素宽度的抗锯齿柔化带

// 绘制绝对顺滑的线条
float lineAlpha = 1.0 - smoothstep(lineThickness, lineThickness + edgeSoftness, distToLine);
```

---

## 第三步：注入设计感 (UI / Typography Integration)

单纯的线条非常枯燥，顶级的前端设计需要通过排版层级（Hierarchy）来建立美感。

### 1. 计曲线与多级透明度 (Index Contours & Micro-textures)
真实地图有“主等高线”和“副等高线”。我们可以通过取模运算（Modulo）将线条分级，赋予不同的粗细、发光度和透明度。

甚至，你可以将密度翻倍，注入成千上万条透明度极低（如 0.04）的“微观等高线”，作为指纹般的精美底纹！

```glsl
float lineIndex = floor(f); // 当前是第几条线

bool isMajor = mod(lineIndex, 20.0) < 0.5; // 主线
bool isInter = (!isMajor) && (mod(lineIndex, 10.0) < 0.5); // 中线
bool isMinor = (!isMajor) && (!isInter) && (mod(lineIndex, 2.0) < 0.5); // 细线

// 根据层级赋予不同线宽
float thickness = isMajor ? 0.4 * df : (isInter ? 0.15 * df : 0.02 * df);

// 根据层级赋予极其克制的透明度
float opacityMult = isMajor ? 0.55 : (isInter ? 0.25 : 0.10);
```

### 2. 电影级暗角与留白 (Vignette & Negative Space)
作为网页背景，**绝对不能喧宾夺主**。
通过褪色和平滑暗角，将用户的视觉强行聚焦到中心网页内容。

```glsl
// 在深谷/海洋区域褪色，留下干净的负空间
float terrainFade = smoothstep(0.0, 0.08, noiseVal);

// 屏幕边缘暗角遮罩，将视线推回屏幕中心
float distToCenter = length(vUv - 0.5);
float vignette = 1.0 - smoothstep(0.4, 0.85, distToCenter);

gl_FragColor = vec4(finalColor, totalAlpha * opacityMult * terrainFade * vignette);
```

---

## 避坑指南

> [!WARNING]  
> 1. **切勿使用 Date.now() 作为 uTime**：`Date.now()` 的十几亿的时间戳会彻底击穿 GLSL Float 类型的 32 位精度极限，导致噪声函数崩溃并渲染出一片纯色（绿屏）。必须使用 `THREE.Clock().getElapsedTime()` 从 0 开始计时。
> 2. **启用 derivatives**：要在 ShaderMaterial 中使用 `fwidth`，必须在 Three.js 中显式声明 `extensions: { derivatives: true }`。
> 3. **处理高分屏**：向 Shader 传递分辨率时，必须结合 `devicePixelRatio`，否则在视网膜屏幕上地形比例会失调。
