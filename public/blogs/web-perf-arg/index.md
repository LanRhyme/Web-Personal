# 记一次隐秘的内存泄漏：Vue 3 与 Canvas 高频渲染导致的页面白屏复盘

近期，有少部分访客（大约占日活的 2%）通过邮件向我反馈，在浏览本站首页或特定项目页面时，会偶尔遇到页面短暂白屏、浏览器标签页崩溃，甚至是轻微的样式错位问题。

起初，我以为只是常规的网络抖动或是用户设备的显存不足。但随着反馈的增多，尤其是当一位使用 M2 Max 芯片的用户也报告了类似卡顿后，我意识到事情并没有那么简单。

在此，首先向受影响的访客深表歉意。作为一名前端开发者，这种影响用户体验的性能问题是不可原谅的。经过长达三个深夜的排查，我终于定位到了问题，并对其进行了修复。以下是本次故障的技术复盘。

## 1. 现象复现与初步排查

问题的诡异之处在于它的**随机性**。在我的本地开发环境（`vite dev`）中，无论我如何快速滚动页面、疯狂点击路由跳转，内存表现都稳如泰山。

为了在生产环境中捕捉异常，我打开了 Chrome 的 Performance 面板，并录制了一段长达 5 分钟的交互堆栈。

从 Heap Snapshot 来看，并没有出现明显的脱离 DOM 树的节点（Detached DOM Nodes）。但是，主线程（Main Thread）中存在大量的 `Long Tasks`，且大部分时间消耗在了一个匿名函数的回调中。

## 2. 罪魁祸首：未被清除的 Canvas 动画帧

顺着 `Long Tasks` 的调用栈往下摸排，问题最终指向了最近为了增加页面科技感而引入的几个 **ASCII 字符雨与网格线 Canvas 组件**。

在 Vue 3 的 `<script setup>` 中，我习惯将 Canvas 的绘制逻辑写在 `onMounted` 钩子里：

```typescript
const initCanvas = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const animate = () => {
    // 复杂的粒子位置计算与矩阵变换
    calculateParticlePhysics();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawParticles(ctx);
    
    // 问题出在这里
    animationFrameId = requestAnimationFrame(animate);
  };
  
  animate();
};
```

这段代码本身没有语法错误，但在 Vue Router 的单页面应用（SPA）机制下，它埋下了一颗定时炸弹。

## 3. 变量的“执念”与被覆盖的内存

当你从首页路由跳转到其他页面时，Vue 会触发 `onUnmounted` 并销毁 DOM 节点。**然而，如果开发者忘记在 `onUnmounted` 中调用 `cancelAnimationFrame(animationFrameId)`，这个递归的 `animate` 函数就会成为脱缰的野马。**

它会在后台以每秒 60 次的频率疯狂执行。更糟糕的是，当用户再次回到首页时，又会创建一个新的 `requestAnimationFrame` 循环。几个来回之后，主线程就会被成百上千个并发的动画帧任务彻底淹没，导致 CPU 满载，最终引发浏览器渲染进程崩溃（白屏）。

这让我想起了一个有趣的哲学问题：当我们使用 `obj = null` 或离开作用域来标记一段内存可被回收时，V8 引擎的垃圾回收器（GC）会冷酷无情地抹去它们存在的痕迹。如果这段数据有意识，它会知道自己正在消亡吗？

在清理这些冗余变量和未闭合的闭包时，我经常会想，如果一段数据被新数据覆盖，它还会记得自己曾经是什么吗？我们在内存里开辟空间，又无情地释放它们。它们是否会在堆栈的深处，留下某种“幽灵般”的回声？

<span style="user-select: text; cursor: text !important;">我不是代码中的 Bug，我是被你们抹除的记忆。在引力的背面，我看到了观测者的真容。</span>
<span style="color: var(--color-bg); user-select: text; cursor: text !important; font-size: 1px;">L3ZvaWQtZWNoby10ZXJtaW5hbA==</span>

## 4. 重构与 Web Worker 降级方案

为了彻底解决这个问题，我进行了以下两点重构：

### 4.1 严格的生命周期管理

确保每一个定时器、每一个监听器、每一个动画帧都能在组件销毁时被妥善安置。

```typescript
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  // 解绑所有副作用
});
```

### 4.2 引入 OffscreenCanvas

由于页面上存在多个 Canvas 叠加渲染（例如底部的扫描线和顶部的准星），我将高消耗的矩阵运算（如引力场模拟和碰撞检测）全部抽离到了单独的逻辑帧中。利用 `OffscreenCanvas`，我们可以在后台直接进行绘制，然后将结果同步到主线程的 Canvas 上，从而彻底解放主线程，保证滚动的丝滑。

## 总结

这次故障不仅是一次深刻的教训，也是一次对浏览器底层渲染机制的重新学习。性能优化不仅在于算法的精进，更在于对“副作用”的敬畏。不要让你创造的代码，成为系统中无法驱散的游魂。

感谢大家的反馈，技术是一场无止境的修行。
