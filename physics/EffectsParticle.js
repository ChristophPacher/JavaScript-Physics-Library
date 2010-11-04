// EffectsParticle.js
// Copyright (c) 2008-2010 Christoph Pacher (http://www.christophpacher.com)
//
// This physics library is freely distributable under the terms of an MIT-style license.

Effect.ScaleP = Class.create(Effect.Scale, {
  initialize: function(element, percent) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      scaleX: true,
      scaleY: true,
      scaleContent: true,
      scaleFromCenter: false,
      scaleMode: 'box',        // 'box' or 'contents' or { } with provided values
      scaleFrom: 100.0,
      scaleTo:   percent
    }, arguments[2] || { });
    // physics changes start
    this.mParticleP = this.element.particle;
    this.mOldScaleN = this.mParticleP.mScaleN;
    var startScaleN = this.mParticleP.mScaleN * (options.scaleFrom/100.0);
    this.mParticleP.mNewScaleN = startScaleN;
    this.mParticleP.setAwake(true);
    // changes end
    this.start(options);
  },
  update: function(position) {
    // physics changes start
    // scale from corner and scale xy independently missing
    var currentScale = this.mOldScaleN * ((this.options.scaleFrom/100.0) + (this.factor * position));
    this.mParticleP.mNewScaleN = currentScale;
    // physics changes end
  }
});


// if mParticle.mNoForcesB == Particle.mNoCollImpB == mNoIntegrationB == mExControlledB ==true;
// with this effect it is assured that the particle moves from a to b with no distraction
// if you just want it to give it a nodge in a direction, push() an impuls vector
// on the mExternalImpulsesA Array. these impulses get added even during an Effect
// so dont mix them, if you dont want to.
Effect.MoveP = Class.create(Effect.Move, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      x:    0,
      y:    0,
      mode: 'relative'
    }, arguments[1] || { });
    // physics changes start
    this.mParticleP = this.element.particle;
    this.mParticleP.setAwake(true);
    this.mOldPosN = 0;
    this.px2m = this.mParticleP.mWorldW3D.mRenderer.px2m;
    // changes end
    this.start(options);
  },
  // physics changes start
  update: function(position) {
      var change = (position - this.mOldPosN)* this.px2m;
      this.mParticleP.externUpdateDisplace([this.options.x  * change, this.options.y  * change, 0], this.options.fps);
      this.mOldPosN = position;
  }
  // changes end
});


// Same as MoveP but movement is done not via setting position but via setting
// velocity (Impulses). if you want to give a particle some nodges in a direction, but still
// want it to react corretly to forces and collisions, this is effect is better
// than MoveP
Effect.MoveImP = Class.create(Effect.Move, {
  initialize: function(element) {
    this.element = $(element);
    if (!this.element) throw(Effect._elementDoesNotExistError);
    var options = Object.extend({
      x:    0,
      y:    0,
      mode: 'relative'
    }, arguments[1] || { });
    // physics changes start
    this.mParticleP = this.element.particle;
    this.mParticleP.setAwake(true);
    this.mOldPosN = 0;
    this.px2m = this.mParticleP.mWorldW3D.mRenderer.px2m;
    // changes end
    this.start(options);
  },
  // physics changes start
  update: function(position) {
      
      var change = (position - this.mOldPosN) * this.px2m;
      this.mParticleP.mExternalImpulsesA.push([this.options.x  * change, this.options.y  * change, 0]);
      this.mOldPosN = position;
      
  }
  // changes end
});

// Changes Particle: replaced Effect.Move by Effect.MoveP
Effect.ShakeP = function(element) {
  element = $(element);
  var options = Object.extend({
    distance: 20,
    duration: 0.5
  }, arguments[1] || {});
  var distance = parseFloat(options.distance);
  var split = parseFloat(options.duration) / 10.0;
  var oldStyle = {
    top: element.getStyle('top'),
    left: element.getStyle('left') };
// changes start
    return new Effect.MoveP(element,
      { x:  distance, y: 0, duration: split, afterFinishInternal: function(effect) {
    new Effect.MoveP(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.MoveP(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.MoveP(effect.element,
      { x: -distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    new Effect.MoveP(effect.element,
      { x:  distance*2, y: 0, duration: split*2,  afterFinishInternal: function(effect) {
    
    new Effect.MoveP(effect.element,
      Object.extend({ x: -distance, y: 0, duration: split}, options)
// changes end
  ) }}) }}) }}) }}) }});
};


Effect.PuffP = function(element) {
  element = $(element);
  var oldStyle = {
    opacity: element.getInlineOpacity(),
    position: element.getStyle('position'),
    top:  element.style.top,
    left: element.style.left,
    width: element.style.width,
    height: element.style.height
  };
  return new Effect.Parallel(
  // changes: replaces Scale by ScaleP
   [ new Effect.ScaleP(element, 400,
     Object.extend({ sync: true, scaleFromCenter: true, scaleContent: true, restoreAfterFinish: true}), arguments[1] || { }),

     new Effect.Opacity(element, { sync: true, to: 0.0 } ) ],
     Object.extend({ duration: 1.0,
      beforeSetupInternal: function(effect) {
        Position.absolutize(effect.effects[0].element)
      },
      afterFinishInternal: function(effect) {
         effect.effects[0].element.hide().setStyle(oldStyle); }
     }, arguments[1] || { })
   );
};
