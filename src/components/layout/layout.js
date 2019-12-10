import React, { useState, useEffect, forwardRef } from "react";
import { graphql, Link } from "gatsby";
import BackIcon from "../../assets/icons/back.svg";
import layoutStyles from "./layout.module.scss";
import "../../global.scss";
import { DarkLightButton } from "../dark-light-button";
import { ThemeContext, setThemeColorsToVars } from "../theme-context";
import TransitionLink, { TransitionState } from "gatsby-plugin-transition-link";
import posed from "react-pose";

const Main = forwardRef(({ children, ...props }, ref) => (
	<main {...props} ref={ref}>
		{children}
	</main>
));
// posed.main is not a thing
const AnimMainTed = posed.div({
	enteringPage: {
		// When back btn is pressed, entry page (list) should go -100 -> 0, but others should go to 0 -> 100vw
		// Otherwise, the entry page (post) should go from 100, but the list (not back btn)
		// isEntryPage = true
		x: 0,

		transition: ({ isBackBtn }) => ({
			type: "tween",
			from: isBackBtn ? "-100vw" : "100vw",
			key: "x",
			duration: 600
		})
	},

	leavingPage: {
		x: ({ isBackBtn }) => (isBackBtn ? "100vw" : "-100vw"),

		// isEntryPage = true
		transition: {
			type: "tween",
			duration: 600
		}
	}
});

export const Layout = ({ location, children }) => {
	// eslint-disable-next-line no-undef
	const rootPath = `${__PATH_PREFIX__}/`;

	const isBase = location.pathname === rootPath;
	const isBlogPost = location.pathname.startsWith(`${rootPath}posts`);

	const [currentTheme, setCurrentTheme] = useState("light");

	const winLocalStorage = global && global.window && global.window.localStorage;

	useEffect(() => {
		if (!winLocalStorage) return;
		const themeName = winLocalStorage.getItem("currentTheme") || "light";
		setThemeColorsToVars(themeName);
		setCurrentTheme(themeName);
	}, [winLocalStorage]);

	const setTheme = val => {
		setThemeColorsToVars(val);
		setCurrentTheme(val);
		localStorage.setItem("currentTheme", val);
	};

	return (
		<ThemeContext.Provider
			value={{
				currentTheme,
				setTheme
			}}
		>
			<div className={layoutStyles.horizCenter}>
				<header
					className={layoutStyles.header}
					aria-label={"Toolbar for primary action buttons"}
				>
					{!isBase && (
						<TransitionLink
							className={`${layoutStyles.backBtn} baseBtn`}
							to={`/`}
							exit={{
								state: { isBackBtn: true, isEntryPage: false },
								length: 0.6
							}}
							entry={{
								state: { isBackBtn: true, isEntryPage: true }
							}}
							aria-label="Go back"
						>
							<BackIcon />
						</TransitionLink>
					)}
					<DarkLightButton />
				</header>
				<TransitionState>
					{transitionProps => {
						const {
							transitionStatus,
							current: { state: { isBackBtn = false } = {} }
						} = transitionProps;
						return (
							<AnimMainTed
								className={!isBlogPost ? "listViewContent" : "postViewContent"}
								pose={
									!["entering", "entered"].includes(transitionStatus)
										? "leavingPage"
										: "enteringPage"
								}
								posedKey={`${isBackBtn}${transitionStatus}${location.pathname}`}
								isBackBtn={isBackBtn}
							>
								{children}
							</AnimMainTed>
						);
					}}
				</TransitionState>
			</div>
		</ThemeContext.Provider>
	);
};

export const authorFragmentQuery = graphql`
	fragment UnicornInfo on UnicornsJson {
		name
		id
		description
		color
		fields {
			isAuthor
		}
		roles {
			prettyname
			id
		}
		socials {
			twitter
			github
			website
		}
		pronouns {
			they
			them
			their
			theirs
			themselves
		}
		profileImg {
			childImageSharp {
				smallPic: fixed(width: 60) {
					...GatsbyImageSharpFixed
				}
				mediumPic: fixed(width: 85) {
					...GatsbyImageSharpFixed
				}
				bigPic: fixed(width: 300, quality: 100) {
					...GatsbyImageSharpFixed
				}
			}
		}
	}
`;

export const postFragmentQuery = graphql`
	fragment PostInfo on MarkdownRemark {
		id
		excerpt(pruneLength: 160)
		html
		frontmatter {
			title
			published(formatString: "MMMM DD, YYYY")
			tags
			description
			authors {
				...UnicornInfo
			}
			license {
				licenceType
				footerImg
				explainLink
				name
				displayName
			}
		}
		fields {
			slug
		}
		wordCount {
			words
		}
	}
`;
