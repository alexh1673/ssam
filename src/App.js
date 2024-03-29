import React from 'react';
import './App.css';

// IMPORT DATA MANAGEMENT AND TRANSACTION STUFF
import DBManager from './db/DBManager';

// THESE ARE OUR REACT COMPONENTS
import DeleteModal from './components/DeleteModal';
import Banner from './components/Banner.js'
import Sidebar from './components/Sidebar.js'
import Workspace from './components/Workspace.js';
import Statusbar from './components/Statusbar.js'
import jsTPS from './jsTPS';
import ChangeItem_Transaction from './transactions/ChangeItem_Transaction'
import ChangeState_Transaction from './transactions/ChangeState_Transaction'

class App extends React.Component {
    constructor(props) {
        super(props);

        // THIS WILL TALK TO LOCAL STORAGE
        this.db = new DBManager();

        this.tps = new jsTPS();

        // GET THE SESSION DATA FROM OUR DATA MANAGER
        let loadedSessionData = this.db.queryGetSessionData();

        // SETUP THE INITIAL STATE
        this.state = {
            currentList : null,
            sessionData : loadedSessionData
        }
    }
    sortKeyNamePairsByName = (keyNamePairs) => {
        keyNamePairs.sort((keyPair1, keyPair2) => {
            // GET THE LISTS
            return keyPair1.name.localeCompare(keyPair2.name);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CREATING A NEW LIST
    createNewList = () => {
        // FIRST FIGURE OUT WHAT THE NEW LIST'S KEY AND NAME WILL BE
        let newKey = this.state.sessionData.nextKey;
        let newName = "Untitled" + newKey;

        // MAKE THE NEW LIST
        let newList = {
            key: newKey,
            name: newName,
            items: ["?", "?", "?", "?", "?"]
        };

        // MAKE THE KEY,NAME OBJECT SO WE CAN KEEP IT IN OUR
        // SESSION DATA SO IT WILL BE IN OUR LIST OF LISTS
        let newKeyNamePair = { "key": newKey, "name": newName };
        let updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);

        // CHANGE THE APP STATE SO THAT IT THE CURRENT LIST IS
        // THIS NEW LIST AND UPDATE THE SESSION DATA SO THAT THE
        // NEXT LIST CAN BE MADE AS WELL. NOTE, THIS setState WILL
        // FORCE A CALL TO render, BUT THIS UPDATE IS ASYNCHRONOUS,
        // SO ANY AFTER EFFECTS THAT NEED TO USE THIS UPDATED STATE
        // SHOULD BE DONE VIA ITS CALLBACK
        this.setState(prevState => ({
            currentList: newList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs
            }
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationCreateList(newList);
        });
    }
    renameList = (key, newName) => {
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === key) {
                pair.name = newName;
            }
        }
        this.sortKeyNamePairsByName(newKeyNamePairs);

        // WE MAY HAVE TO RENAME THE currentList
        let currentList = this.state.currentList;
        if (currentList.key === key) {
            currentList.name = newName;
        }

        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            let list = this.db.queryGetList(key);
            list.name = newName;
            this.db.mutationUpdateList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF LOADING A LIST FOR EDITING
    loadList = (key) => {
        let a = document.getElementById("close-button")
        a.classList.remove("disabled")
        let b = document.getElementById("redo-button")
        b.classList.remove("disabled")
        let c = document.getElementById("undo-button")
        c.classList.remove("disabled")

        let newCurrentList = this.db.queryGetList(key);
        this.setState(prevState => ({
            currentList: newCurrentList,
            sessionData: prevState.sessionData
        }), () => {
            // ANY AFTER EFFECTS?
        });
    }

    // THIS FUNCTION BEGINS THE PROCESS OF CLOSING THE CURRENT LIST
    closeCurrentList = () => {
        let a = document.getElementById("close-button")
        a.classList.add("disabled")
        let b = document.getElementById("redo-button")
        b.classList.add("disabled")
        let c = document.getElementById("undo-button")
        c.classList.add("disabled")
        this.tps.clearAllTransactions()
        this.setState(prevState => ({
            currentList: null,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: this.state.sessionData
        }), () => {
            // ANY AFTER EFFECTS?
        });
    }
    deleteList = (keyNamePairs) => {
        // SOMEHOW YOU ARE GOING TO HAVE TO FIGURE OUT
        // WHICH LIST IT IS THAT THE USER WANTS TO
        // DELETE AND MAKE THAT CONNECTION SO THAT THE
        // NAME PROPERLY DISPLAYS INSIDE THE MODAL
        this.showDeleteListModal(keyNamePairs);
        let baz = keyNamePairs.key
        console.log(baz)

        this.setState(prevState => ({
            curr : baz
        }), () => {
            // ANY AFTER EFFECTS?
        });
        console.log(this.state.curr)
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST
    showDeleteListModal() {
        let modal = document.getElementById("delete-modal");
        modal.classList.add("is-visible");
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteListModal() {
        let modal = document.getElementById("delete-modal");
        modal.classList.remove("is-visible");
    }

    modalDelete = () =>{
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs]
        var ine;
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === this.state.curr) {
                ine = i
            }
        }
        newKeyNamePairs.splice(ine,1)
        this.sortKeyNamePairsByName(newKeyNamePairs)
        
        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
        let modal = document.getElementById("delete-modal");
        modal.classList.remove("is-visible");
    }

    editItem = (key, newName) => {
        let theList = this.state.currentList;

        let transaction = new ChangeItem_Transaction(this, key, theList.items[key], newName);
        this.tps.addTransaction(transaction);
    }


    changeItem = (id, text) =>{
        let theList = this.state.currentList;

        theList.items[id] = text;

        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }),() => {
            this.db.mutationUpdateList(theList);
        });
    }


    dnd = (i,j) => {
        let transaction = new ChangeState_Transaction(this,i,j);
        this.tps.addTransaction(transaction);
        let c = document.getElementById("undo-button")
        c.classList.remove("disabled")
    }

    dnd2 = (i,j) =>
    {
        let theList = this.state.currentList.items
        theList.splice(i, 0, theList.splice(j, 1)[0])
        console.log(theList)

        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }),() => {
            this.db.mutationUpdateList(theList);
        });
    }


    undo = () =>{
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();
        }
        
        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }),() => {
            
        });
    }

    
    redo = () =>{
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();
        }
        this.setState(prevState => ({
            currentList: prevState.currentList,
            sessionData: prevState.sessionData
        }),() => {
            
        });
    }

    

    handleKeyDown = (event) =>
    {
        if(event.ctrlKey)
            if(event.key == "z")
                this.undo()
    }

    componentDidMount = () =>
    {
        document.addEventListener("keydown",this.handleKeyDown)

    }
    
    render() {
        return (
            <div id="app-root">
                <Banner 
                    title='Top 5 Lister'
                    undo={this.undo}
                    redo={this.redo}
                    closeCallback={this.closeCurrentList} />
                <Sidebar
                    heading='Your Lists'
                    currentList={this.state.currentList}
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    createNewListCallback={this.createNewList}
                    deleteListCallback={this.deleteList}
                    loadListCallback={this.loadList}
                    renameListCallback={this.renameList}
                />
                <Workspace
                    currentList={this.state.currentList} 
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    editItem = {this.editItem}
                    dnd = {this.dnd}
                    />
                <Statusbar 
                    currentList={this.state.currentList} />
                <DeleteModal
                    hideDeleteListModalCallback={this.hideDeleteListModal}
                    modalDelete={this.modalDelete}
                    listKeyPair={this.state.currentList}
                />
            </div>
        );
    }
}

export default App;
