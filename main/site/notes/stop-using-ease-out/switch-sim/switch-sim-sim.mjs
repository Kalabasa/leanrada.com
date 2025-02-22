// max angular distance from upright position
const maxAngle = Math.PI * 0.11;

export class SwitchSim {
  switchArmLength = 1.5; // cm
  pinLength = 0.75; // cm
  // distance of spring from switch hinge
  springDistance = 1.25; // cm
  springNaturalLength = 0.75; // cm
  springConstant = 9;
  mass = 20;
  baseRestitution = 0.8;

  /**
   * 0.0: off
   * 1.0: on
   * @type {number}
   */
  switchPosition = 0;
  /**
   * @type {number}
   */
  switchAngularVelocity = 0;
  /**
   * @type {"off"|"on"}
   */
  presserSide = "on";
  /**
   * <1.0: not touching
   * =1.0: touching
   * >1.0: pressuring
   * @type {number}
   */
  presserValue = 0;

  update(dt) {
    // fixed timestep
    const step = 0.1e-3;
    let total = dt;
    while (total > 0) {
      this.switchAngularVelocity += this.netAngularAcceleration;
      this.switchPosition += this.switchAngularVelocity * Math.min(step, total);
      total -= step;
    }
  }

  // 0 is upright, negative towards off, positive towards on
  get switchAngle() {
    return 2 * (this.switchPosition - 0.5) * maxAngle;
  }

  // where origin is the hinge
  get pin() {
    return {
      x: Math.sin(this.switchAngle) * this.pinLength,
      y: Math.cos(this.switchAngle) * this.pinLength,
    };
  }

  get springCompressedLength() {
    // cos(-switchAngle)      = adjacent / springCompressedLength
    // springCompressedLength = adjacent / cos(-switchAngle)
    // springCompressedLength = adjacent / cos(-switchAngle)
    //                        = (springDistance - pin.y) / cos(-switchAngle)
    return (this.springDistance - this.pin.y) / Math.cos(-this.switchAngle);
  }

  // displacement of the spring's free end along its length
  // negative is compressed
  get springDisplacement() {
    return this.springCompressedLength - this.springNaturalLength;
  }

  get springForce() {
    return -this.springConstant * this.springDisplacement;
  }

  get tangentialSpringForce() {
    const springAngle = Math.atan2(
      this.pin.x,
      this.pin.y - this.springDistance
    );
    return Math.sin(this.switchAngle - springAngle) * this.springForce;
  }

  // torque due to spring
  get switchSpringTorque() {
    return this.tangentialSpringForce * this.pinLength;
  }

  get presser() {
    return {
      yOffset: Math.min(0, this.presserValue - 1) * this.switchArmLength,
    };
  }

  get presserForce() {
    if (this.presserValue < 1) return 0;
    return (this.presserValue - 1) * (this.presserSide === "off" ? -1 : 1);
  }

  get presserNormalForce() {
    const netForce = this.netTorque / this.switchArmLength;
    const remaining = -netForce - this.presserForce;
    return Math.abs(this.presserForce) > 0 &&
      Math.sign(remaining) !== Math.sign(this.presserForce)
      ? remaining
      : 0;
  }

  get presserTorque() {
    return this.presserForce * this.switchArmLength;
  }

  get netTorque() {
    return -this.presserTorque - this.switchSpringTorque + this.caseTorque;
  }

  // torque applied by the switch's case
  get caseTorque() {
    const endPosition = this.switchPosition < 0.5 ? 0 : 1;

    let damping = 0;
    let spring = 0;
    if (
      this.switchPosition < 0 ||
      this.switchPosition > 1 ||
      Math.abs(endPosition - this.switchPosition) < 1e-2
    ) {
      if (
        Math.sign(this.switchAngularVelocity) ===
        Math.sign(this.switchPosition - 0.5)
      ) {
        damping =
          -0.3 *
          (1 - this.restitution) *
          (this.switchAngularVelocity * this.mass);
      }

      const rawSpring =
        800 * (1 - this.restitution) * (endPosition - this.switchPosition);
      if (Math.sign(rawSpring) !== Math.sign(this.switchPosition - 0.5)) {
        spring = rawSpring;
      }
    }

    return damping + spring;
  }

  // very rough model
  // restitution becomes inelastic because the presser is squishy
  get restitution() {
    return this.baseRestitution / (1 + Math.abs(this.presserForce) * 8);
  }

  get netAngularAcceleration() {
    return this.netTorque / this.mass;
  }
}
