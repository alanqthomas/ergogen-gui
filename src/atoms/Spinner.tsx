import React from 'react';
import styled from "styled-components";
import { ThreeDots } from "react-loader-spinner";

const Spinner = (): JSX.Element => {
		return (
			<SpinnerContainer>
				<ThreeDots color='white' />
			</SpinnerContainer>
		);
}

const SpinnerContainer = styled.div`
	position: absolute;
	padding-left: 1.5rem;
`;

export default Spinner;
