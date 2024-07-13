// max angular distance from upright position
const maxAngle = Math.PI * 0.11;

export class SwitchSim {
  switchArmLength = 1.5; // cm
  pinLength = 0.75; // cm
  // distance of spring from switch hinge
  springDistance = 1.25; // cm
  springNaturalLength = 0.75; // cm
  springConstant = 4;
  mass = 0.2;

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
    const netTorque = -this.presserTorque - this.switchSpringTorque;
    this.switchAngularVelocity += netTorque / this.mass;
    this.switchPosition += this.switchAngularVelocity * dt;

    if (this.switchPosition < 0) {
      this.switchPosition = 0;
      this.switchAngularVelocity = Math.max(0, this.switchAngularVelocity);
    } else if (this.switchPosition > 1) {
      this.switchPosition = 1;
      this.switchAngularVelocity = Math.min(0, this.switchAngularVelocity);
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

  // Force needed to overcome switch force (signed)
  get switchPressForce() {
    return this.switchSpringTorque / this.switchArmLength;
  }

  get presser() {
    return {
      yOffset: Math.min(0, this.presserValue - 1) * this.switchArmLength,
    };
  }

  get presserForce() {
    if (this.presserValue < 1) return 0;
    return this.presserValue - 1;
  }

  get presserNormalForce() {
    if (
      (this.switchPosition - 0.5) * (this.presserSide === "on" ? -1 : 1) >=
        0.5 &&
      this.presserForce > 0
    ) {
      return this.presserForce;
    }
    return Math.min(this.presserForce, Math.abs(this.tangentialSpringForce));
  }

  get presserTorque() {
    return (
      this.presserForce *
      this.switchArmLength *
      (this.presserSide === "off" ? -1 : 1)
    );
  }
}
