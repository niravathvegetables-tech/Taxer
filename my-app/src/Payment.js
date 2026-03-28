 import { useState } from "react";
 import React from 'react';

 class Payment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "Payment"
    };
  }

  render() {
    const { payment, handleEdit } = this.props;

    if (!payment || !Array.isArray(payment)) {
      return <p>Loading...</p>;
    }

    

    return (
      <div className='payment'>
        

         <h2>Welcome to Payment</h2>

      </div>
    );
  }
}

export default Payment;
        